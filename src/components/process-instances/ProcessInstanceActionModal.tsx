import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Icon } from '@iconify/react';
import {
  ProcessInstanceRead,
  ProcessInstanceAction,
} from '@/types/processInstances';

export type InstanceActionType = 'cancel' | 'suspend' | 'resume';

interface ProcessInstanceActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  instance: ProcessInstanceRead | null;
  actionType: InstanceActionType;
  onConfirm: (id: string, action: ProcessInstanceAction) => Promise<unknown>;
  loading?: boolean;
}

const actionDetails: Record<
  InstanceActionType,
  {
    title: string;
    subtitle: string;
    btnClass: string;
    btnText: string;
    icon: string;
    iconColor: string;
  }
> = {
  cancel: {
    title: 'Anuluj instancję procesu',
    subtitle: 'Przerwanie wykonywania procesu bez możliwości wznowienia',
    btnClass: 'bg-rose-600 hover:bg-rose-700 text-white',
    btnText: 'Potwierdź anulowanie',
    icon: 'mdi:close-circle-outline',
    iconColor: 'text-rose-600 bg-rose-50',
  },
  suspend: {
    title: 'Wstrzymaj instancję procesu',
    subtitle: 'Tymczasowe zatrzymanie obsługi kroków i zadań',
    btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    btnText: 'Wstrzymaj proces',
    icon: 'mdi:pause-circle-outline',
    iconColor: 'text-amber-600 bg-amber-50',
  },
  resume: {
    title: 'Wznów instancję procesu',
    subtitle: 'Przywrócenie normalnego wykonywania wstrzymanego procesu',
    btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    btnText: 'Wznów proces',
    icon: 'mdi:play-circle-outline',
    iconColor: 'text-emerald-600 bg-emerald-50',
  },
};

export const ProcessInstanceActionModal: React.FC<ProcessInstanceActionModalProps> = ({
  isOpen,
  onClose,
  instance,
  actionType,
  onConfirm,
  loading = false,
}) => {
  const config = actionDetails[actionType] || actionDetails.cancel;
  const [reason, setReason] = useState('');
  const [lockVersion, setLockVersion] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (instance) {
      setLockVersion(instance.lock_version);
      setReason('');
      setError(null);
    }
  }, [instance, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instance) return;
    setError(null);

    try {
      await onConfirm(instance.id, {
        expected_lock_version: Number(lockVersion),
        reason: reason.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas wykonywania akcji');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
      subtitle={instance ? `${instance.title} (ID: ${instance.id.slice(0, 8)}...)` : config.subtitle}
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
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 ${config.btnClass}`}
          >
            {loading && <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />}
            {config.btnText}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <Icon icon="mdi:alert-circle" className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className={`p-2 rounded-full ${config.iconColor} shrink-0`}>
            <Icon icon={config.icon} className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-600">
            Wersja blokady optymistycznej:{' '}
            <span className="font-mono font-bold text-slate-800">{lockVersion}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Expected Lock Version
          </label>
          <input
            type="number"
            min={0}
            value={lockVersion}
            onChange={(e) => setLockVersion(Number(e.target.value))}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            required
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Zabezpieczenie przed konfliktami współbieżnymi (wersja blokady).
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Powód / Uzasadnienie (opcjonalnie)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Podaj przyczynę podjęcia tej akcji..."
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
};

export default ProcessInstanceActionModal;
