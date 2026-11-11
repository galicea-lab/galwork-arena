import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Icon } from '@iconify/react';
import { ContactRead, ContactCreate, ContactUpdate } from '@/types/contacts';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactToEdit?: ContactRead | null;
  onSubmitCreate: (data: ContactCreate) => Promise<unknown>;
  onSubmitUpdate: (id: string, data: ContactUpdate) => Promise<unknown>;
  loading?: boolean;
}

const FIELD_LABEL = 'block text-xs font-semibold text-slate-700 mb-1';
const TEXT_INPUT =
  'w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

const emptyForm = {
  nip: '',
  pesel: '',
  krs: '',
  regon: '',
  company_name: '',
  last_name: '',
  first_name: '',
  title: '',
  legal_form: '',
  assigned_operator: '',
};

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  contactToEdit,
  onSubmitCreate,
  onSubmitUpdate,
  loading = false,
}) => {
  const isEdit = Boolean(contactToEdit);
  const [form, setForm] = useState(emptyForm);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (contactToEdit) {
      setForm({
        nip: contactToEdit.nip || '',
        pesel: contactToEdit.pesel || '',
        krs: contactToEdit.krs || '',
        regon: contactToEdit.regon || '',
        company_name: contactToEdit.company_name || '',
        last_name: contactToEdit.last_name || '',
        first_name: contactToEdit.first_name || '',
        title: contactToEdit.title || '',
        legal_form: contactToEdit.legal_form || '',
        assigned_operator: contactToEdit.assigned_operator || '',
      });
      setIsActive(contactToEdit.is_active);
    } else {
      setForm(emptyForm);
      setIsActive(true);
    }
    setFormError(null);
  }, [contactToEdit, isOpen]);

  const set = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.company_name.trim() && !form.last_name.trim()) {
      setFormError('Podaj przynajmniej nazwę firmy albo nazwisko.');
      return;
    }

    const payload = {
      nip: form.nip.trim() || null,
      pesel: form.pesel.trim() || null,
      krs: form.krs.trim() || null,
      regon: form.regon.trim() || null,
      company_name: form.company_name.trim() || null,
      last_name: form.last_name.trim() || null,
      first_name: form.first_name.trim() || null,
      title: form.title.trim() || null,
      legal_form: form.legal_form.trim() || null,
      assigned_operator: form.assigned_operator.trim() || null,
    };

    try {
      if (isEdit && contactToEdit) {
        await onSubmitUpdate(contactToEdit.id, { ...payload, is_active: isActive });
      } else {
        await onSubmitCreate(payload);
      }
      onClose();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Wystąpił błąd podczas zapisu kontrahenta');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edytuj kontrahenta' : 'Nowy kontrahent'}
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
            {isEdit ? 'Zapisz zmiany' : 'Utwórz kontrahenta'}
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={FIELD_LABEL}>Firma</label>
            <input value={form.company_name} onChange={set('company_name')} disabled={loading} className={TEXT_INPUT} placeholder="np. ACME Sp. z o.o." />
          </div>
          <div>
            <label className={FIELD_LABEL}>Forma prawna</label>
            <input value={form.legal_form} onChange={set('legal_form')} disabled={loading} className={TEXT_INPUT} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={FIELD_LABEL}>Imię</label>
            <input value={form.first_name} onChange={set('first_name')} disabled={loading} className={TEXT_INPUT} />
          </div>
          <div>
            <label className={FIELD_LABEL}>Nazwisko</label>
            <input value={form.last_name} onChange={set('last_name')} disabled={loading} className={TEXT_INPUT} />
          </div>
          <div>
            <label className={FIELD_LABEL}>Tytuł</label>
            <input value={form.title} onChange={set('title')} disabled={loading} className={TEXT_INPUT} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={FIELD_LABEL}>NIP</label>
            <input value={form.nip} onChange={set('nip')} disabled={loading} className={`${TEXT_INPUT} font-mono`} />
          </div>
          <div>
            <label className={FIELD_LABEL}>PESEL</label>
            <input value={form.pesel} onChange={set('pesel')} disabled={loading} className={`${TEXT_INPUT} font-mono`} />
          </div>
          <div>
            <label className={FIELD_LABEL}>KRS</label>
            <input value={form.krs} onChange={set('krs')} disabled={loading} className={`${TEXT_INPUT} font-mono`} />
          </div>
          <div>
            <label className={FIELD_LABEL}>REGON</label>
            <input value={form.regon} onChange={set('regon')} disabled={loading} className={`${TEXT_INPUT} font-mono`} />
          </div>
        </div>

        <div>
          <label className={FIELD_LABEL}>Przypisany operator</label>
          <input value={form.assigned_operator} onChange={set('assigned_operator')} disabled={loading} className={TEXT_INPUT} />
        </div>

        {isEdit && (
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="contact-is-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={loading}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <label htmlFor="contact-is-active" className="text-xs font-medium text-slate-700 cursor-pointer">
              Kontrahent jest aktywny (widoczny w polach wyboru formularzy)
            </label>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default ContactFormModal;
