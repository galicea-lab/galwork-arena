import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Icon } from '@iconify/react';
import { ContactAddressRead, ContactAddressCreate, ContactAddressUpdate } from '@/types/contacts';

interface ContactAddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  addressToEdit?: ContactAddressRead | null;
  onSubmitCreate: (data: ContactAddressCreate) => Promise<unknown>;
  onSubmitUpdate: (id: string, data: ContactAddressUpdate) => Promise<unknown>;
  loading?: boolean;
}

const FIELD_LABEL = 'block text-xs font-semibold text-slate-700 mb-1';
const TEXT_INPUT =
  'w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

// Adres do - zapisywane jako JSON w `ContactAddress.address`.
const ADDRESS_FIELDS: { key: string; label: string }[] = [
  { key: 'miejscowość', label: 'Miejscowość' },
  { key: 'ulica', label: 'Ulica' },
  { key: 'numer domu', label: 'Numer domu' },
  { key: 'mieszkanie', label: 'Mieszkanie' },
  { key: 'kod pocztowy', label: 'Kod pocztowy' },
  { key: 'poczta', label: 'Poczta' },
  { key: 'województwo', label: 'Województwo' },
  { key: 'gmina', label: 'Gmina' },
  { key: 'powiat', label: 'Powiat' },
  { key: 'państwo', label: 'Państwo' },
];

const emptyAddress: Record<string, string> = Object.fromEntries(ADDRESS_FIELDS.map((f) => [f.key, '']));

export const ContactAddressFormModal: React.FC<ContactAddressFormModalProps> = ({
  isOpen,
  onClose,
  addressToEdit,
  onSubmitCreate,
  onSubmitUpdate,
  loading = false,
}) => {
  const isEdit = Boolean(addressToEdit);

  const [label, setLabel] = useState('');
  const [ade, setAde] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [validFrom, setValidFrom] = useState('');
  const [address, setAddress] = useState<Record<string, string>>(emptyAddress);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (addressToEdit) {
      setLabel(addressToEdit.label);
      setAde(addressToEdit.ade || '');
      setIsPrimary(addressToEdit.is_primary);
      setValidFrom(addressToEdit.valid_from || '');
      setAddress({ ...emptyAddress, ...(addressToEdit.address as Record<string, string>) });
    } else {
      setLabel('');
      setAde('');
      setIsPrimary(false);
      setValidFrom('');
      setAddress(emptyAddress);
    }
    setFormError(null);
  }, [addressToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!label.trim()) {
      setFormError('Etykieta adresu jest wymagana (np. "Adres do korespondencji").');
      return;
    }

    const addressPayload = Object.fromEntries(
      Object.entries(address).filter(([, v]) => v.trim() !== '')
    );

    const payload = {
      label: label.trim(),
      ade: ade.trim() || null,
      is_primary: isPrimary,
      valid_from: validFrom || null,
      address: addressPayload,
    };

    try {
      if (isEdit && addressToEdit) {
        await onSubmitUpdate(addressToEdit.id, payload);
      } else {
        await onSubmitCreate(payload);
      }
      onClose();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Wystąpił błąd podczas zapisu adresu');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edytuj adres' : 'Nowy adres'}
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
            {isEdit ? 'Zapisz zmiany' : 'Dodaj adres'}
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
            <label className={FIELD_LABEL}>
              Etykieta <span className="text-rose-500">*</span>
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={loading}
              placeholder="np. Adres do korespondencji"
              className={TEXT_INPUT}
              required
            />
          </div>
          <div>
            <label className={FIELD_LABEL}>ADE (adres e-Doręczeń)</label>
            <input
              value={ade}
              onChange={(e) => setAde(e.target.value)}
              disabled={loading}
              placeholder="AE:PL-xxxxx-xxxxx-XXXXX-nn"
              className={`${TEXT_INPUT} font-mono`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ADDRESS_FIELDS.map((f) => (
            <div key={f.key}>
              <label className={FIELD_LABEL}>{f.label}</label>
              <input
                value={address[f.key]}
                onChange={(e) => setAddress((prev) => ({ ...prev, [f.key]: e.target.value }))}
                disabled={loading}
                className={TEXT_INPUT}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <label className={FIELD_LABEL}>Ważny od</label>
            <input
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              disabled={loading}
              className={TEXT_INPUT}
            />
          </div>
          <div className="flex items-center gap-3 pb-2">
            <input
              type="checkbox"
              id="address-is-primary"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              disabled={loading}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <label htmlFor="address-is-primary" className="text-xs font-medium text-slate-700 cursor-pointer">
              To jest główny adres
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ContactAddressFormModal;
