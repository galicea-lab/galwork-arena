import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Icon } from '@iconify/react';
import { DictionaryEntryRead, DictionaryEntryCreate, DictionaryEntryUpdate } from '@/types/dictionaryEntries';

interface DictionaryEntryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  dictionaryKey: string;
  entryToEdit?: DictionaryEntryRead | null;
  onSubmitCreate: (data: DictionaryEntryCreate) => Promise<unknown>;
  onSubmitUpdate: (id: string, data: DictionaryEntryUpdate) => Promise<unknown>;
  loading?: boolean;
}

export const DictionaryEntryFormModal: React.FC<DictionaryEntryFormModalProps> = ({
  isOpen,
  onClose,
  dictionaryKey,
  entryToEdit,
  onSubmitCreate,
  onSubmitUpdate,
  loading = false,
}) => {
  const isEdit = Boolean(entryToEdit);

  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (entryToEdit) {
      setCode(entryToEdit.code);
      setLabel(entryToEdit.label);
      setSortOrder(entryToEdit.sort_order);
      setIsActive(entryToEdit.is_active);
    } else {
      setCode('');
      setLabel('');
      setSortOrder(0);
      setIsActive(true);
    }
    setFormError(null);
  }, [entryToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!code.trim() || !label.trim()) {
      setFormError('Kod i etykieta są wymagane.');
      return;
    }

    try {
      if (isEdit && entryToEdit) {
        await onSubmitUpdate(entryToEdit.id, {
          code: code.trim(),
          label: label.trim(),
          sort_order: sortOrder,
          is_active: isActive,
        });
      } else {
        await onSubmitCreate({
          dictionary_key: dictionaryKey,
          code: code.trim(),
          label: label.trim(),
          sort_order: sortOrder,
          is_active: isActive,
        });
      }
      onClose();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Wystąpił błąd podczas zapisu wiersza słownika');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edytuj wiersz słownika' : 'Nowy wiersz słownika'}
      subtitle={`Słownik: ${dictionaryKey}`}
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
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading && <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Zapisz zmiany' : 'Dodaj wiersz'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <Icon icon="mdi:alert-circle" className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Kod <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={loading}
            placeholder="np. IT"
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
            required
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Unikalny w ramach słownika &quot;{dictionaryKey}&quot; - to jest wartość zapisywana w formularzach.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Etykieta <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            disabled={loading}
            placeholder="np. Dział IT"
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Kolejność sortowania</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
            disabled={loading}
            className="w-32 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="entry-is-active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={loading}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
          />
          <label htmlFor="entry-is-active" className="text-xs font-medium text-slate-700 cursor-pointer">
            Wiersz jest aktywny (widoczny w polach wyboru formularzy)
          </label>
        </div>
      </form>
    </Modal>
  );
};

export default DictionaryEntryFormModal;
