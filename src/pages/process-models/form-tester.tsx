import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { Icon } from '@iconify/react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchProcessModels,
  fetchProcessModelVersions,
  fetchProcessModelFileContent,
  syncProcessModelsFromDisk,
} from '@/store/processModels';
import { SchemaForm, LoadingSpinner } from '@/components';
import { filterFormForStep, hasXPermissions, collectStepNames, JsonObject } from '@/utils/formPermissions';

/**
 * Narzędzie twórcy procesów: podgląd dowolnego pliku JSON Schema/UI Schema
 * z już zapisanej wersji modelu procesu, przefiltrowanego wg `x-permissions`
 * dla wybranego kroku - bez potrzeby startowania instancji w silniku.

 * Uwaga! Strona jest ogólnie dostępna przez URL (odczyt - jak reszta modułu wf),
 * ale link w nawigacji jest widoczny tylko dla `galwork-admin`
 * (TailwindLayout.tsx, zob. src/hooks/useIsAdmin.ts) - to narzędzie dla
 * twórców obiegów, nie dla zwykłych użytkowników.
 *
 */
export default function FormTesterPage() {
  const dispatch = useAppDispatch();
  const { items: models, versions, fileContents, lastSyncResults, syncing } = useAppSelector(
    (state) => state.processModels
  );

  const [modelId, setModelId] = useState('');
  const [versionId, setVersionId] = useState('');
  const [schemaFileId, setSchemaFileId] = useState('');
  const [uiFileId, setUiFileId] = useState('');
  const [step, setStep] = useState('');
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    if (models.length === 0) {
      dispatch(fetchProcessModels({ active_only: false }));
    }
  }, [dispatch, models.length]);

  useEffect(() => {
    if (modelId) {
      dispatch(fetchProcessModelVersions(modelId));
    }
  }, [dispatch, modelId]);

  const modelVersions = versions[modelId] ?? [];
  const version = modelVersions.find((v) => v.id === versionId);
  const schemaFiles = (version?.files ?? []).filter((f) => f.file_type === 'json_schema');
  const uiFiles = (version?.files ?? []).filter((f) => f.file_type === 'ui_schema');

  // Poniższe trzy auto-wybory dzieją się w ciele renderu, nie w `useEffect`
  // (zob. ten sam wzorzec i uzasadnienie w AsyncSelectWidget.tsx/
  // TailwindLayout.tsx - "adjusting state when a prop changes", unika
  // kaskadowego setState w efekcie). Gdy dane (pliki wersji) jeszcze się
  // ładują, odpowiedni warunek po prostu nie jest spełniony w tym renderze
  // i zadziała przy kolejnym, gdy `schemaFiles`/`uiFiles` się wypełnią.

  // Nowa wersja -> wyczyść wybór pliku (dotychczasowy należał do innej wersji).
  const [lastVersionId, setLastVersionId] = useState(versionId);
  if (versionId !== lastVersionId) {
    setLastVersionId(versionId);
    setSchemaFileId('');
  }
  // Pliki wersji już znane, a nic nie wybrane - wybierz pierwszy plik schematu.
  if (!schemaFileId && schemaFiles.length > 0 && versionId === lastVersionId) {
    setSchemaFileId(schemaFiles[0].id);
  }

  // Zmiana pliku schematu -> wyczyść dotychczasowy wybór uiSchema/dane.
  const [lastSchemaFileId, setLastSchemaFileId] = useState(schemaFileId);
  if (schemaFileId !== lastSchemaFileId) {
    setLastSchemaFileId(schemaFileId);
    setUiFileId('');
    setFormData({});
  }
  // Zgadnij odpowiadający plik uiSchema po nazwie (konwencja "x-schema.json"
  // / "x-uischema.json" - zob. rjsf.md), gdy nic jeszcze nie wybrano.
  if (!uiFileId && uiFiles.length > 0 && schemaFileId === lastSchemaFileId) {
    const schemaFile = schemaFiles.find((f) => f.id === schemaFileId);
    const guessedName = schemaFile?.file_name.replace(/-schema\.json$/, '-uischema.json');
    const guess = uiFiles.find((f) => f.file_name === guessedName);
    setUiFileId(guess?.id ?? uiFiles[0].id);
  }

  useEffect(() => {
    if (modelId && versionId && schemaFileId) {
      dispatch(fetchProcessModelFileContent({ processModelId: modelId, versionId, fileId: schemaFileId }));
    }
  }, [dispatch, modelId, versionId, schemaFileId]);

  useEffect(() => {
    if (modelId && versionId && uiFileId) {
      dispatch(fetchProcessModelFileContent({ processModelId: modelId, versionId, fileId: uiFileId }));
    }
  }, [dispatch, modelId, versionId, uiFileId]);

  const parsed = useMemo(() => {
    const rawSchema = schemaFileId ? fileContents[schemaFileId] : undefined;
    const rawUi = uiFileId ? fileContents[uiFileId] : undefined;
    if (rawSchema === undefined) return { schema: null, uiSchema: {}, error: null as string | null };
    try {
      const schema = JSON.parse(rawSchema) as JsonObject;
      const uiSchema = rawUi ? (JSON.parse(rawUi) as JsonObject) : {};
      return { schema, uiSchema, error: null };
    } catch (err) {
      return {
        schema: null,
        uiSchema: {},
        error: err instanceof Error ? err.message : 'Niepoprawny JSON',
      };
    }
  }, [fileContents, schemaFileId, uiFileId]);

  const stepNames = useMemo(
    () => (parsed.schema ? collectStepNames(parsed.schema) : []),
    [parsed.schema]
  );

  // Nazwy kroków się zmieniły (nowy schemat) i obecnie wybrany krok już nie
  // istnieje - wybierz pierwszy dostępny (podczas renderu, jak wyżej).
  if (stepNames.length > 0 && !stepNames.includes(step)) {
    setStep(stepNames[0]);
  }

  const schemaHasPermissions = parsed.schema ? hasXPermissions(parsed.schema) : false;

  const filtered = useMemo(() => {
    const schema = parsed.schema;
    if (!schema) return null;
    if (!schemaHasPermissions) return { schema, uiSchema: parsed.uiSchema };
    if (!step) return null;
    return filterFormForStep(schema, parsed.uiSchema, step);
  }, [parsed.schema, parsed.uiSchema, schemaHasPermissions, step]);

  const displayed = useMemo(() => {
    const schema = parsed.schema;
    if (!schema) return null;
    return showRaw ? { schema, uiSchema: parsed.uiSchema } : filtered;
  }, [showRaw, parsed.schema, parsed.uiSchema, filtered]);

  return (
    <>
      <Head>
        <title>Testuj formularz | Galwork Workflow</title>
      </Head>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Testuj formularz</h1>
            <p className="text-xs text-slate-500 mt-1">
              Podgląd JSON Schema + uiSchema zapisanej wersji modelu, przefiltrowany wg{' '}
              <code>x-permissions</code> dla wybranego kroku - bez startowania instancji procesu.
            </p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(syncProcessModelsFromDisk(false))}
            disabled={syncing}
            title="Skanuje spiffworkflow/ i tworzy/aktualizuje wersje draft dla zmienionych obiegów (nigdy nie publikuje)"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors disabled:opacity-50 shrink-0"
          >
            <Icon icon={syncing ? 'mdi:loading' : 'mdi:sync'} className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Synchronizuj z dysku
          </button>
        </div>

        {lastSyncResults && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-1.5 max-h-48 overflow-auto">
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
              Wynik synchronizacji ({lastSyncResults.length} folderów)
            </p>
            {lastSyncResults.map((r) => (
              <div key={r.folder} className="flex items-center gap-2">
                <StatusDot status={r.status} />
                <span className="font-mono text-slate-700">{r.key}</span>
                <span className="text-slate-400 truncate">{r.folder}</span>
                {r.detail && <span className="text-slate-400">({r.detail})</span>}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <Field label="Model procesu">
                <select
                  value={modelId}
                  onChange={(e) => {
                    setModelId(e.target.value);
                    setVersionId('');
                  }}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Wybierz --</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.key})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Wersja">
                <select
                  value={versionId}
                  onChange={(e) => setVersionId(e.target.value)}
                  disabled={!modelId}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                >
                  <option value="">-- Wybierz --</option>
                  {modelVersions.map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.version} ({v.status})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Plik schematu (JSON Schema)">
                <select
                  value={schemaFileId}
                  onChange={(e) => setSchemaFileId(e.target.value)}
                  disabled={schemaFiles.length === 0}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                >
                  <option value="">-- Wybierz --</option>
                  {schemaFiles.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.file_name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Plik widoku (UI Schema)">
                <select
                  value={uiFileId}
                  onChange={(e) => setUiFileId(e.target.value)}
                  disabled={uiFiles.length === 0}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                >
                  <option value="">(brak)</option>
                  {uiFiles.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.file_name}
                    </option>
                  ))}
                </select>
              </Field>

              {schemaHasPermissions && (
                <Field label="Krok (x-permissions)">
                  <select
                    value={step}
                    onChange={(e) => setStep(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {stepNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              {schemaHasPermissions && (
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={showRaw}
                    onChange={(e) => setShowRaw(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300"
                  />
                  Pokaż niefiltrowany master schema (ignoruj krok)
                </label>
              )}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-xs min-h-[16rem]">
              {!schemaFileId ? (
                <p className="text-xs text-slate-400">Wybierz model, wersję i plik schematu.</p>
              ) : parsed.error ? (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  Plik nie jest poprawnym JSON: {parsed.error}
                </div>
              ) : !parsed.schema ? (
                <LoadingSpinner message="Wczytywanie schematu..." />
              ) : displayed ? (
                <SchemaForm
                  schema={displayed.schema}
                  uiSchema={displayed.uiSchema}
                  formData={formData}
                  onChange={setFormData}
                />
              ) : (
                <p className="text-xs text-slate-400">Wybierz krok.</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-xl border border-slate-200 bg-slate-900 p-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Icon icon="mdi:code-json" className="w-3.5 h-3.5" />
                formData (wynik formularza)
              </p>
              <pre className="text-[11px] leading-relaxed text-emerald-300 overflow-auto max-h-[32rem] whitespace-pre-wrap break-all">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'error'
      ? 'bg-rose-500'
      : status === 'draft-created' || status === 'would-create-draft' || status === 'would-create-model'
        ? 'bg-amber-500'
        : 'bg-emerald-500';
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${color}`} title={status} />;
}
