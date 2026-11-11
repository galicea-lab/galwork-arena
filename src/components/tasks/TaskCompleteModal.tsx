import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { SchemaForm } from '@/components/forms';
import { Icon } from '@iconify/react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchTaskForm, clearTaskForm } from '@/store/tasks';
import { TaskCompleteRequest } from '@/types/tasks';
import { hasFormSchema } from '@/types/forms';

interface TaskCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskName: string;
  onConfirm: (taskId: string, request: TaskCompleteRequest) => Promise<unknown>;
  loading?: boolean;
}

export const TaskCompleteModal: React.FC<TaskCompleteModalProps> = ({
  isOpen,
  onClose,
  taskId,
  taskName,
  onConfirm,
  loading = false,
}) => {
  const dispatch = useAppDispatch();
  const { taskForm, taskFormError } = useAppSelector((state) => state.tasks);

  // Wartości edytowane są klucowane po zadaniu - zmiana zadania resetuje je
  // bez wywoływania setState w efekcie.
  const [jsonData, setJsonData] = useState('{\n  "approved": true,\n  "comment": ""\n}');
  const [dataEdit, setDataEdit] = useState<{ taskId: string; data: Record<string, unknown> } | null>(
    null
  );
  const [lockEdit, setLockEdit] = useState<{ taskId: string; value: number } | null>(null);
  const [errorEdit, setErrorEdit] = useState<{ taskId: string; message: string } | null>(null);

  const activeForm = taskForm && taskForm.task_id === taskId ? taskForm : null;
  const useSchema = Boolean(activeForm && hasFormSchema(activeForm.json_schema));
  const formPending = !activeForm && !taskFormError;

  const formData = useMemo(
    () => dataEdit?.taskId === taskId ? dataEdit.data : activeForm?.form_data ?? {},
    [dataEdit, taskId, activeForm]
  );
  const lockVersion =
    lockEdit?.taskId === taskId ? lockEdit.value : activeForm?.process_lock_version ?? 0;
  const error = errorEdit?.taskId === taskId ? errorEdit.message : null;

  const handleDataChange = (data: Record<string, unknown>) => setDataEdit({ taskId, data });
  const handleLockChange = (value: number) => setLockEdit({ taskId, value });
  const handleError = (message: string | null) =>
    setErrorEdit(message ? { taskId, message } : null);

  useEffect(() => {
    if (isOpen && taskId) {
      dispatch(fetchTaskForm(taskId));
    }
  }, [isOpen, taskId, dispatch]);

  useEffect(() => {
    if (!isOpen) {
      dispatch(clearTaskForm());
    }
  }, [isOpen, dispatch]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (formPending) {
      return;
    }
    handleError(null);

    let parsed: Record<string, unknown>;
    if (useSchema && activeForm) {
      parsed = formData;
    } else {
      try {
        parsed = JSON.parse(jsonData);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          handleError('Dane zadania muszą być poprawnym obiektem JSON (klucz-wartość).');
          return;
        }
      } catch {
        handleError('Niepoprawny format JSON w formularzu danych zadania.');
        return;
      }
    }

    try {
      await onConfirm(taskId, {
        expected_lock_version: Number(lockVersion),
        data: parsed,
      });
      onClose();
    } catch (err: unknown) {
      handleError(err instanceof Error ? err.message : 'Błąd podczas zatwierdzania zadania');
    }
  };

  const formArea = formPending ? (
    <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
      <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
      Pobieranie formularza zadania...
    </div>
  ) : useSchema && activeForm ? (
    <div>
      <p className="block text-xs font-semibold text-slate-700 mb-1.5">
        Dane wyjściowe zadania (formularz)
      </p>
      <SchemaForm
        schema={activeForm.json_schema}
        uiSchema={activeForm.ui_schema}
        formData={formData}
        disabled={loading}
        onChange={handleDataChange}
        onSubmit={() => handleSubmit()}
      />
    </div>
  ) : (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        Dane wyjściowe zadania (JSON Payload) <span className="text-rose-500">*</span>
      </label>
      <textarea
        value={jsonData}
        onChange={(e) => setJsonData(e.target.value)}
        disabled={loading}
        rows={8}
        className="w-full text-xs p-3 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-900 text-slate-100 resize-y"
        placeholder='{ "decision": "ACCEPT", "comment": "Zgoda" }'
        required
      />
      <p className="text-[11px] text-slate-400 mt-1">
        Wartości zmiennych przekazywane do silnika SpiffWorkflow do kolejnego kroku procesu.
      </p>
    </div>
  );

  const body = (
    <>
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {!formPending && !useSchema && taskFormError && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          Nie udało się pobrać formularza ({taskFormError}). Użyto zapasowego edytora JSON.
        </div>
      )}

      {activeForm && activeForm.documents.length > 0 && (
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-xs font-semibold text-slate-700 mb-1.5">
            Dokumenty powiązane z zadaniem
          </p>
          <ul className="space-y-1">
            {activeForm.documents.map((doc) => (
              <li key={doc.id} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                <Icon icon="mdi:file-document-outline" className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{doc.title}</span>
                {doc.current_version && (
                  <span className="text-slate-400 font-mono shrink-0">
                    v{doc.current_version_no} · {doc.current_version.file_name}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Wersja blokady (expected_lock_version) <span className="text-rose-500">*</span>
        </label>
        <input
          type="number"
          min={0}
          value={lockVersion}
          onChange={(e) => handleLockChange(Number(e.target.value))}
          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          required
        />
      </div>

      {formArea}
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Zakończ i zatwierdź zadanie"
      subtitle={`Przesłanie danych formularza dla: ${taskName}`}
      maxWidth="lg"
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
            disabled={loading || formPending}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
          >
            {loading && <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />}
            <Icon icon="mdi:check" className="w-4 h-4" />
            Zatwierdź i przejdź dalej
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

export default TaskCompleteModal;
