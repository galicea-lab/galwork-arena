import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useAppDispatch, useAppSelector } from '@/store';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import {
  fetchContact,
  updateContact,
  createContactAddress,
  updateContactAddress,
  deleteContactAddress,
} from '@/store/contacts';
import { ContactFormModal, ContactAddressFormModal } from '@/components';
import { Badge } from '@/components/common/Badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import {
  ContactAddressRead,
  ContactAddressCreate,
  ContactAddressUpdate,
  ContactUpdate,
} from '@/types/contacts';

function contactDisplayName(name: {
  company_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}): string {
  return name.company_name || [name.first_name, name.last_name].filter(Boolean).join(' ') || '—';
}

export default function ContactDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const dispatch = useAppDispatch();
  const isAdmin = useIsAdmin();

  const { selectedContact, loading, saving } = useAppSelector((state) => state.contacts);

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isAddressModalOpen, setAddressModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<ContactAddressRead | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<ContactAddressRead | null>(null);

  useEffect(() => {
    if (typeof id === 'string') {
      dispatch(fetchContact(id));
    }
  }, [dispatch, id]);

  if (loading && !selectedContact) {
    return <LoadingSpinner message="Wczytywanie kontrahenta..." />;
  }

  if (!selectedContact || typeof id !== 'string') {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500">Nie znaleziono kontrahenta.</p>
        <Link href="/contacts" className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
          <Icon icon="mdi:arrow-left" className="w-4 h-4" />
          Powrót do listy kontrahentów
        </Link>
      </div>
    );
  }

  const contact = selectedContact;

  const handleUpdateContact = async (contactId: string, data: ContactUpdate) => {
    await dispatch(updateContact({ id: contactId, data })).unwrap();
  };

  const handleCreateAddress = async (data: ContactAddressCreate) => {
    await dispatch(createContactAddress({ contactId: contact.id, data })).unwrap();
  };

  const handleUpdateAddress = async (addressId: string, data: ContactAddressUpdate) => {
    await dispatch(updateContactAddress({ addressId, data, contactId: contact.id })).unwrap();
  };

  const handleConfirmDeleteAddress = async () => {
    if (!addressToDelete) return;
    await dispatch(deleteContactAddress({ addressId: addressToDelete.id, contactId: contact.id })).unwrap();
    setAddressToDelete(null);
  };

  return (
    <>
      <Head>
        <title>{contactDisplayName(contact)} | Kontrahenci | Galwork Workflow</title>
      </Head>

      <div className="space-y-6">
        <Link href="/contacts" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
          <Icon icon="mdi:arrow-left" className="w-4 h-4" />
          Powrót do listy kontrahentów
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{contactDisplayName(contact)}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={contact.is_active ? 'success' : 'default'} size="sm">
                  {contact.is_active ? 'Aktywny' : 'Nieaktywny'}
                </Badge>
                {contact.legal_form && <span className="text-xs text-slate-400">{contact.legal_form}</span>}
              </div>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                <Icon icon="mdi:pencil" className="w-4 h-4" />
                Edytuj
              </button>
            )}
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
            <div>
              <dt className="text-slate-400">NIP</dt>
              <dd className="font-mono text-slate-700">{contact.nip || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">PESEL</dt>
              <dd className="font-mono text-slate-700">{contact.pesel || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">KRS</dt>
              <dd className="font-mono text-slate-700">{contact.krs || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">REGON</dt>
              <dd className="font-mono text-slate-700">{contact.regon || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Przypisany operator</dt>
              <dd className="text-slate-700">{contact.assigned_operator || '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Adresy ({contact.addresses.length})</h2>
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setAddressToEdit(null);
                setAddressModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              <Icon icon="mdi:plus" className="w-4 h-4" />
              Nowy adres
            </button>
          )}
        </div>

        {contact.addresses.length === 0 ? (
          <EmptyState icon="mdi:map-marker-off-outline" title="Brak adresów" description="Ten kontrahent nie ma jeszcze żadnego adresu." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contact.addresses.map((address) => (
              <div key={address.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      {address.label}
                      {address.is_primary && (
                        <Badge variant="primary" size="sm">
                          Główny
                        </Badge>
                      )}
                    </p>
                    {address.ade && <p className="text-[11px] font-mono text-slate-400 mt-0.5">{address.ade}</p>}
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setAddressToEdit(address);
                          setAddressModalOpen(true);
                        }}
                        title="Edytuj"
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      >
                        <Icon icon="mdi:pencil" className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddressToDelete(address)}
                        title="Usuń"
                        className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Icon icon="mdi:delete-outline" className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <dl className="mt-3 space-y-1 text-[11px] text-slate-600">
                  {Object.entries(address.address).map(([key, value]) => (
                    <div key={key} className="flex gap-1.5">
                      <dt className="text-slate-400 capitalize">{key}:</dt>
                      <dd>{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        )}

        <ContactFormModal
          isOpen={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
          contactToEdit={contact}
          onSubmitCreate={async () => {}}
          onSubmitUpdate={handleUpdateContact}
          loading={saving}
        />

        <ContactAddressFormModal
          isOpen={isAddressModalOpen}
          onClose={() => setAddressModalOpen(false)}
          addressToEdit={addressToEdit}
          onSubmitCreate={handleCreateAddress}
          onSubmitUpdate={handleUpdateAddress}
          loading={saving}
        />

        <ConfirmDialog
          isOpen={!!addressToDelete}
          onClose={() => setAddressToDelete(null)}
          onConfirm={handleConfirmDeleteAddress}
          title="Usunąć adres?"
          message={addressToDelete ? `Adres "${addressToDelete.label}" zostanie trwale usunięty.` : ''}
          confirmText="Usuń"
          variant="danger"
          loading={saving}
        />
      </div>
    </>
  );
}
