import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useAppDispatch, useAppSelector } from '@/store';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { fetchContacts, createContact, deleteContact } from '@/store/contacts';
import { ContactList, ContactFormModal } from '@/components';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ContactRead, ContactCreate } from '@/types/contacts';

export default function ContactsPage() {
  const dispatch = useAppDispatch();
  const isAdmin = useIsAdmin();
  const { items, loading, saving } = useAppSelector((state) => state.contacts);

  const [search, setSearch] = useState('');
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<ContactRead | null>(null);

  useEffect(() => {
    dispatch(fetchContacts({ q: search || undefined }));
  }, [dispatch, search]);

  const handleCreate = async (data: ContactCreate) => {
    await dispatch(createContact(data)).unwrap();
    dispatch(fetchContacts({ q: search || undefined }));
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;
    await dispatch(deleteContact(contactToDelete.id)).unwrap();
    setContactToDelete(null);
    dispatch(fetchContacts({ q: search || undefined }));
  };

  return (
    <>
      <Head>
        <title>Kontrahenci | Galwork Workflow</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kontrahenci</h1>
          <p className="text-xs text-slate-500 mt-1">
            Firmy i osoby wraz z ich adresami (słownik &quot;Adres e-Doręczeń&quot; i inne pola wyboru
            kontrahenta w formularzach).
          </p>
        </div>

        <ContactList
          contacts={items}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          onCreateContact={isAdmin ? () => setFormModalOpen(true) : undefined}
          onDeleteContact={isAdmin ? (contact) => setContactToDelete(contact) : undefined}
        />

        <ContactFormModal
          isOpen={isFormModalOpen}
          onClose={() => setFormModalOpen(false)}
          onSubmitCreate={handleCreate}
          onSubmitUpdate={async () => {}}
          loading={saving}
        />

        <ConfirmDialog
          isOpen={!!contactToDelete}
          onClose={() => setContactToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Usunąć kontrahenta?"
          message={
            contactToDelete
              ? `Kontrahent "${contactToDelete.company_name || contactToDelete.last_name}" i wszystkie jego adresy (${contactToDelete.addresses.length}) zostaną trwale usunięte.`
              : ''
          }
          confirmText="Usuń"
          variant="danger"
          loading={saving}
        />
      </div>
    </>
  );
}
