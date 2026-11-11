import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Icon } from '@iconify/react';
import { TaskClaimRequest } from '@/types/tasks';

interface TaskClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskName: string;
  onConfirm: (taskId: string, request: TaskClaimRequest) => Promise<unknown>;
  loading?: boolean;
}

export const TaskClaimModal: React.FC<TaskClaimModalProps> = ({
  isOpen,
  onClose,
  taskId,
  taskName,
  onConfirm,
  loading = false,
}) => {
  const [lockVersion, setLockVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onConfirm(taskId, {
        expected_lock_version: Number(lockVersion),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Błąd podczas podejmowania zadania');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Podejmij zadanie (Claim)"
      subtitle={`Przydzielenie zadania do bieżącego użytkownika: ${taskName}`}
      maxWidth="md"
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
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading && <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />}
            <Icon icon="mdi:account-arrow-right" className="w-4 h-4" />
            Podejmij zadanie
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-800 flex items-start gap-2.5">
          <Icon icon="mdi:information" className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p>
            Podjęcie zadania przypisze je do Twojego konta. Inni uprawnieni kandydaci nie będą mogli
            go realizować do momentu jego zwolnienia lub ukończenia.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Wersja blokady (expected_lock_version)
          </label>
          <input
            type="number"
            min={0}
            value={lockVersion}
            onChange={(e) => setLockVersion(Number(e.target.value))}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            required
          />
        </div>
      </form>
    </Modal>
  );
};

export default TaskClaimModal;
