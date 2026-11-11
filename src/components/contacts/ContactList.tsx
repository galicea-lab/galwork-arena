import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { ContactRead } from '@/types/contacts';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface ContactListProps {
  contacts: ContactRead[];
  loading?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onCreateContact?: () => void;
  onDeleteContact?: (contact: ContactRead) => void;
}

function contactDisplayName(contact: ContactRead): string {
  return (
    contact.company_name ||
    [contact.first_name, contact.last_name].filter(Boolean).join(' ') ||
    contact.id
  );
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  loading = false,
  search,
  onSearchChange,
  onCreateContact,
  onDeleteContact,
}) => {
  const [localSearch, setLocalSearch] = useState(search);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearchChange(localSearch);
          }}
          className="relative w-full max-w-md"
        >
          <Icon icon="mdi:magnify" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Szukaj po nazwie, nazwisku, NIP, PESEL..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </form>

        {onCreateContact && (
          <button
            type="button"
            onClick={onCreateContact}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors shrink-0"
          >
            <Icon icon="mdi:plus" className="w-4 h-4" />
            Nowy kontrahent
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner message="Wczytywanie kontrahentów..." />
      ) : contacts.length === 0 ? (
        <EmptyState
          icon="mdi:card-account-details-outline"
          title="Brak kontrahentów"
          description={search ? 'Nie znaleziono kontrahentów pasujących do zapytania.' : 'Nie ma jeszcze żadnych kontrahentów.'}
          action={
            onCreateContact && (
              <button
                type="button"
                onClick={onCreateContact}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Icon icon="mdi:plus" className="w-4 h-4" />
                Dodaj pierwszego kontrahenta
              </button>
            )
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Nazwa</th>
                  <th className="px-4 py-3">NIP / PESEL</th>
                  <th className="px-4 py-3">Adresy</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/contacts/${contact.id}`} className="font-medium text-slate-900 hover:text-blue-600 block text-sm">
                        {contactDisplayName(contact)}
                      </Link>
                      {contact.legal_form && <span className="text-[11px] text-slate-400">{contact.legal_form}</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{contact.nip || contact.pesel || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{contact.addresses.length}</td>
                    <td className="px-4 py-3">
                      <Badge variant={contact.is_active ? 'success' : 'default'} size="sm">
                        {contact.is_active ? 'Aktywny' : 'Nieaktywny'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onDeleteContact && (
                          <button
                            type="button"
                            onClick={() => onDeleteContact(contact)}
                            title="Usuń"
                            className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Icon icon="mdi:delete-outline" className="w-4 h-4" />
                          </button>
                        )}
                        <Link href={`/contacts/${contact.id}`} title="Szczegóły" className="p-1 rounded text-blue-600 hover:bg-blue-50">
                          <Icon icon="mdi:eye" className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactList;
