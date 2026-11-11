import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Badge } from '@/components/common/Badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  ProcessModelRead,
  ProcessModelVersionRead,
  ProcessModelVersionStatus,
} from '@/types/processModels';

interface ProcessModelDetailProps {
  model: ProcessModelRead;
  versions?: ProcessModelVersionRead[];
  /** Brak (`undefined`) = użytkownik bez roli `galwork-admin` - akcja jest
   * ukryta (zob. src/hooks/useIsAdmin.ts; pages/process-models/[id].tsx). */
  onEditModel?: () => void;
  onNewVersion?: () => void;
  onPublishVersion?: (versionId: string) => Promise<unknown>;
  onStartInstance?: () => void;
  loading?: boolean;
}

const versionStatusBadgeMap: Record<
  ProcessModelVersionStatus,
  { label: string; variant: 'success' | 'warning' | 'default' }
> = {
  published: { label: 'Opublikowana', variant: 'success' },
  draft: { label: 'Wersja robocza (Draft)', variant: 'warning' },
  retired: { label: 'Wycofana', variant: 'default' },
};

export const ProcessModelDetail: React.FC<ProcessModelDetailProps> = ({
  model,
  versions = [],
  onEditModel,
  onNewVersion,
  onPublishVersion,
  onStartInstance,
  loading = false,
}) => {
  const [versionToPublish, setVersionToPublish] = useState<ProcessModelVersionRead | null>(null);
  const [publishing, setPublishing] = useState(false);

  const handleConfirmPublish = async () => {
    if (!versionToPublish || !onPublishVersion) return;
    setPublishing(true);
    try {
      await onPublishVersion(versionToPublish.id);
      setVersionToPublish(null);
    } finally {
      setPublishing(false);
    }
  };

  const hasPublishedVersion = versions.some((v) => v.status === 'published');

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Icon icon="mdi:sitemap" className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{model.name}</h1>
                <Badge variant={model.is_active ? 'success' : 'default'}>
                  {model.is_active ? 'Aktywny' : 'Nieaktywny'}
                </Badge>
                {model.category && (
                  <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                    {model.category}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-400 mt-1">Klucz: {model.key}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onStartInstance && model.is_active && (
              <button
                type="button"
                onClick={onStartInstance}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
              >
                <Icon icon="mdi:play" className="w-4 h-4" />
                Startuj proces
              </button>
            )}

            {onNewVersion && (
              <button
                type="button"
                onClick={onNewVersion}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
              >
                <Icon icon="mdi:source-branch" className="w-4 h-4" />
                Nowa wersja
              </button>
            )}

            {onEditModel && (
              <button
                type="button"
                onClick={onEditModel}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
              >
                <Icon icon="mdi:pencil" className="w-4 h-4 text-slate-500" />
                Edytuj
              </button>
            )}
          </div>
        </div>

        {model.description && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
            {model.description}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">ID zasobu</span>
            <span className="font-mono text-slate-700 text-[11px] truncate block" title={model.id}>
              {model.id}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Utworzono</span>
            <span className="text-slate-700">
              {new Date(model.created_at).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Liczba wersji</span>
            <span className="text-slate-700 font-semibold">{versions.length}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Status publikacji</span>
            <span className="text-slate-700">
              {hasPublishedVersion ? (
                <span className="text-emerald-600 font-medium">Wersja gotowa do pracy</span>
              ) : (
                <span className="text-amber-600 font-medium">Brak opublikowanej wersji</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Versions Section */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Historia wersji modelu</h2>
            <p className="text-xs text-slate-500">
              Wszystkie zarejestrowane rewizje diagramów BPMN i powiązanych schematów
            </p>
          </div>
          {onNewVersion && (
            <button
              type="button"
              onClick={onNewVersion}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Icon icon="mdi:plus" className="w-3.5 h-3.5" />
              Dodaj wersję
            </button>
          )}
        </div>

        {versions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Icon icon="mdi:source-branch" className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-700">Brak wersji dla tego modelu</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Aby móc uruchamiać proces, musisz utworzyć i opublikować co najmniej jedną wersję.
            </p>
            {onNewVersion && (
              <button
                type="button"
                onClick={onNewVersion}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Icon icon="mdi:plus" className="w-4 h-4" />
                Utwórz wersję v1
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {versions.map((ver) => {
              const badge = versionStatusBadgeMap[ver.status] || {
                label: ver.status,
                variant: 'default',
              };

              return (
                <div key={ver.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center">
                        v{ver.version}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800">
                            BPMN: {ver.bpmn_process_id}
                          </span>
                          <Badge variant={badge.variant} size="sm">
                            {badge.label}
                          </Badge>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 block">
                          Hash: {ver.content_hash.slice(0, 16)}...
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {ver.status === 'draft' && onPublishVersion && (
                        <button
                          type="button"
                          onClick={() => setVersionToPublish(ver)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                        >
                          <Icon icon="mdi:check-circle" className="w-3.5 h-3.5" />
                          Publikuj wersję
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Files list */}
                  {ver.files && ver.files.length > 0 && (
                    <div className="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-600 block mb-2">
                        Pliki składowe ({ver.files.length}):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {ver.files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded border border-slate-200 text-xs"
                          >
                            <Icon
                              icon={
                                file.file_type === 'bpmn'
                                  ? 'mdi:file-tree'
                                  : file.file_type === 'dmn'
                                  ? 'mdi:table'
                                  : 'mdi:code-json'
                              }
                              className="w-4 h-4 text-slate-500 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-slate-800 truncate" title={file.file_name}>
                                {file.file_name}
                              </p>
                              <span className="text-[10px] text-slate-400 uppercase">
                                {file.file_type}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-400">
                    <span>Utworzono: {new Date(ver.created_at).toLocaleString()}</span>
                    {ver.published_at && (
                      <span className="text-emerald-600">
                        Opublikowano: {new Date(ver.published_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Publish Confirmation Modal */}
      {versionToPublish && (
        <ConfirmDialog
          isOpen={Boolean(versionToPublish)}
          onClose={() => setVersionToPublish(null)}
          onConfirm={handleConfirmPublish}
          title="Opublikować wersję modelu?"
          message={`Czy na pewno chcesz opublikować wersję v${versionToPublish.version} (${versionToPublish.bpmn_process_id})? Opublikowanie tej wersji automatycznie wycofa poprzednio aktywną wersję.`}
          confirmText="Publikuj"
          variant="primary"
          loading={publishing}
        />
      )}
    </div>
  );
};

export default ProcessModelDetail;
