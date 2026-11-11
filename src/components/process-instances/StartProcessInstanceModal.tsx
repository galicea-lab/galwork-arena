import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/common/Modal';
import { SchemaForm } from '@/components/forms';
import { Icon } from '@iconify/react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchStartForm, clearStartForm } from '@/store/processInstances';
import { ProcessInstanceCreate } from '@/types/processInstances';
import { ProcessModelRead } from '@/types/processModels';
import { hasFormSchema } from '@/types/forms';

interface StartProcessInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProcessInstanceCreate) => Promise<unknown>;
  availableModels?: ProcessModelRead[];
  initialModelKey?: string;
  loading?: boolean;
}

export const StartProcessInstanceModal: React.FC<StartProcessInstanceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableModels = [],
  initialModelKey = '',
  loading = false,
}) => {
  const dispatch = useAppDispatch();
  const { startForm, startFormError } = useAppSelector((state) => state.processInstances);

  const [modelKey, setModelKey] = useState(initialModelKey);
  const [title, setTitle] = useState('');
  const [businessKey, setBusinessKey] = useState('');
  const [jsonData, setJsonData] = useState('{\n  \n}');
  const [dataEdit, setDataEdit] = useState<{ key: string; data: Record<string, unknown> } | null>(
    null
  );
  const [documentIds, setDocumentIds] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialModelKey) {
        setModelKey(initialModelKey);
      } else if (availableModels.length > 0 && !modelKey) {
        setModelKey(availableModels[0].key);
      }
      setTitle('');
      setBusinessKey('');
      setJsonData('{\n  \n}');
      setDocumentIds('');
      setError(null);
    }
  }, [isOpen, initialModelKey, availableModels]);

  // Formularz startowy pobieramy tylko dla kluczy znanych w liście modeli
  // (albo wskazanego na starcie) - pisanie wolnego tekstu nie generuje 404.
  const formModelKey = availableModels.some((m) => m.key === modelKey)
    ? modelKey
    : initialModelKey && modelKey === initialModelKey
      ? initialModelKey
      : '';

  useEffect(() => {
    if (!isOpen) {
      dispatch(clearStartForm());
    } else if (formModelKey) {
      dispatch(fetchStartForm(formModelKey));
    } else {
      dispatch(clearStartForm());
    }
  }, [isOpen, formModelKey, dispatch]);

  const activeForm =
    startForm && formModelKey && startForm.process_model_key === formModelKey ? startForm : null;
  const useSchema = Boolean(activeForm && hasFormSchema(activeForm.json_schema));
  const formPending = Boolean(formModelKey) && !activeForm && !startFormError;

  // Dane edytowane kluczem modelu - przełączenie modelu resetuje je bez
  // setState w efekcie.
  const startFormData = useMemo(
    () => dataEdit?.key === formModelKey ? dataEdit.data : activeForm?.form_data ?? {},
    [dataEdit, formModelKey, activeForm]
  );
  const handleStartDataChange = (data: Record<string, unknown>) =>
    setDataEdit({ key: formModelKey, data });

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (formPending) {
      return;
    }
    setError(null);

    if (!modelKey.trim()) {
      setError('Klucz modelu procesu jest wymagany.');
      return;
    }

    if (!title.trim()) {
      setError('Tytuł instancji procesu jest wymagany.');
      return;
    }

    let parsedData: Record<string, unknown> | undefined = undefined;
    if (useSchema && activeForm) {
      if (Object.keys(startFormData).length > 0) {
        parsedData = startFormData;
      }
    } else if (jsonData.trim()) {
      try {
        parsedData = JSON.parse(jsonData);
      } catch {
        setError('Pole Dane początkowe (JSON) zawiera niepoprawny format JSON.');
        return;
      }
    }

    const docs = documentIds
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      await onSubmit({
        process_model_key: modelKey.trim(),
        title: title.trim(),
        business_key: businessKey.trim() || null,
        data: parsedData,
        document_ids: docs.length > 0 ? docs : undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas uruchamiania instancji');
    }
  };

  const body = (
    <>
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <Icon icon="mdi:alert-circle" className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Model procesu <span className="text-rose-500">*</span>
        </label>
        {availableModels.length > 0 ? (
          <select
            value={modelKey}
            onChange={(e) => setModelKey(e.target.value)}
            disabled={loading}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            required
          >
            <option value="">-- Wybierz model --</option>
            {availableModels.map((m) => (
              <option key={m.id} value={m.key} disabled={!m.is_active}>
                {m.name} ({m.key}) {!m.is_active ? '[nieaktywny]' : ''}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={modelKey}
            onChange={(e) => setModelKey(e.target.value)}
            disabled={loading}
            placeholder="np. invoice-wf"
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            required
          />
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Tytuł instancji <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          placeholder="np. FV/2026/03/001 - Zakup licencji"
          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          maxLength={500}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Klucz biznesowy (Business Key)
        </label>
        <input
          type="text"
          value={businessKey}
          onChange={(e) => setBusinessKey(e.target.value)}
          disabled={loading}
          placeholder="np. ORDER-9941 / ZAM-123"
          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
      </div>

      {formPending ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
          <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
          Pobieranie formularza startowego...
        </div>
      ) : useSchema && activeForm ? (
        <div>
          <p className="block text-xs font-semibold text-slate-700 mb-1.5">
            Dane początkowe (formularz procesu)
          </p>
          <SchemaForm
            schema={activeForm.json_schema}
            uiSchema={activeForm.ui_schema}
            formData={startFormData}
            disabled={loading}
            onChange={handleStartDataChange}
            onSubmit={() => handleSubmit()}
          />
        </div>
      ) : (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Dane początkowe (JSON Payload)
          </label>
          <textarea
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            disabled={loading}
            rows={4}
            placeholder='{ "amount": 1250.00, "applicant": "jan.kowalski@example.com" }'
            className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-slate-900 text-slate-100 resize-y"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Identyfikatory powiązanych dokumentów (jeden UUID w linii)
        </label>
        <textarea
          value={documentIds}
          onChange={(e) => setDocumentIds(e.target.value)}
          disabled={loading}
          rows={2}
          placeholder="f47ac10b-58cc-4372-a567-0e02b2c3d479"
          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none"
        />
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Uruchom nową instancję procesu"
      subtitle="Zainicjuj nowy obieg w silniku procesowym SpiffWorkflow"
      maxWidth="xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
          >
            {loading && <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />}
            <Icon icon="mdi:play" className="w-4 h-4" />
            Uruchom proces
          </button>
        </>
      }
    >
      {useSchema ? (
        <div className="space-y-4">{body}</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {body}
        </form>
      )}
    </Modal>
  );
};

export default StartProcessInstanceModal;
