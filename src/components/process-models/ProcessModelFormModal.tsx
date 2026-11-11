import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Icon } from '@iconify/react';
import {
  ProcessModelRead,
  ProcessModelCreate,
  ProcessModelUpdate,
} from '@/types/processModels';

interface ProcessModelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitCreate: (data: ProcessModelCreate) => Promise<unknown>;
  onSubmitUpdate?: (id: string, data: ProcessModelUpdate) => Promise<unknown>;
  modelToEdit?: ProcessModelRead | null;
  loading?: boolean;
}

export const ProcessModelFormModal: React.FC<ProcessModelFormModalProps> = ({
  isOpen,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
  modelToEdit,
  loading = false,
}) => {
  const isEdit = Boolean(modelToEdit);

  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (modelToEdit) {
      setKey(modelToEdit.key);
      setName(modelToEdit.name);
      setDescription(modelToEdit.description || '');
      setCategory(modelToEdit.category || '');
      setIsActive(modelToEdit.is_active);
    } else {
      setKey('');
      setName('');
      setDescription('');
      setCategory('');
      setIsActive(true);
    }
    setFormError(null);
  }, [modelToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Nazwa modelu jest wymagana.');
      return;
    }

    if (!isEdit) {
      const keyPattern = /^[a-z0-9][a-z0-9-]{1,62}$/;
      if (!keyPattern.test(key.trim())) {
        setFormError(
          'Klucz musi mieć 2-63 znaków, zawierać tylko małe litery, cyfry i myślniki oraz zaczynać się od litery lub cyfry.'
        );
        return;
      }

      try {
        await onSubmitCreate({
          key: key.trim(),
          name: name.trim(),
          description: description.trim() || null,
          category: category.trim() || null,
        });
        onClose();
      } catch (err: unknown) {
        setFormError(err instanceof Error ? err.message : 'Wystąpił błąd podczas tworzenia modelu');
      }
    } else if (modelToEdit && onSubmitUpdate) {
      try {
        await onSubmitUpdate(modelToEdit.id, {
          name: name.trim(),
          description: description.trim() || null,
          category: category.trim() || null,
          is_active: isActive,
        });
        onClose();
      } catch (err: unknown) {
        setFormError(err instanceof Error ? err.message : 'Wystąpił błąd podczas aktualizacji modelu');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edytuj model procesu' : 'Utwórz nowy model procesu'}
      subtitle={isEdit ? `ID: ${modelToEdit?.id}` : 'Zdefiniuj klucz i nazwę nowego procesu biznesowego'}
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
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading && <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Zapisz zmiany' : 'Utwórz model'}
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
            Klucz techniczny (Key) {!isEdit && <span className="text-rose-500">*</span>}
          </label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value.toLowerCase())}
            disabled={isEdit || loading}
            placeholder="np. invoice-approval-wf"
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 font-mono"
            required={!isEdit}
          />
          <p className="text-[11px] text-slate-400 mt-1">
            {isEdit
              ? 'Klucz jest niezmienny po utworzeniu modelu.'
              : 'Identyfikator używany w wywołaniach API (małe litery, cyfry, myślniki, 2-63 znaki).'}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nazwa procesu <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            placeholder="np. Akceptacja faktury kosztowej"
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Kategoria</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={loading}
            placeholder="np. Finanse, HR, Logistyka"
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Opis</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={3}
            placeholder="Opcjonalny opis celu i zakresu procesu biznesowego..."
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
        </div>

        {isEdit && (
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="model-is-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={loading}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <label htmlFor="model-is-active" className="text-xs font-medium text-slate-700 cursor-pointer">
              Model jest aktywny (dostępny do uruchamiania nowych instancji)
            </label>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default ProcessModelFormModal;
