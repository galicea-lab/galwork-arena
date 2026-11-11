import React from 'react';
import Modal from './Modal';
import { Icon } from '@iconify/react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

const variantConfig = {
  danger: {
    btnClass: 'bg-rose-600 hover:bg-rose-700 text-white',
    icon: 'mdi:alert-circle-outline',
    iconColor: 'text-rose-600 bg-rose-50',
  },
  warning: {
    btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    icon: 'mdi:alert-outline',
    iconColor: 'text-amber-600 bg-amber-50',
  },
  primary: {
    btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    icon: 'mdi:help-circle-outline',
    iconColor: 'text-blue-600 bg-blue-50',
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Zatwierdź',
  cancelText = 'Anuluj',
  variant = 'primary',
  loading = false,
}) => {
  const config = variantConfig[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 ${config.btnClass}`}
          >
            {loading && <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />}
            {confirmText}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className={`p-2.5 rounded-full ${config.iconColor} shrink-0`}>
          <Icon icon={config.icon} className="w-6 h-6" />
        </div>
        <div className="text-sm text-slate-600 leading-relaxed pt-1">{message}</div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
