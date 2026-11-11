import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { DictionaryEntryRead } from '@/types/dictionaryEntries';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface DictionaryEntryListProps {
  entries: DictionaryEntryRead[];
  loading?: boolean;
  /** Brak (`undefined`) = użytkownik bez roli `galwork-admin` - przyciski
   * są ukryte (zob. src/hooks/useIsAdmin.ts). */
  onCreateEntry?: () => void;
  onEditEntry?: (entry: DictionaryEntryRead) => void;
  onDeleteEntry?: (entry: DictionaryEntryRead) => void;
}

export const DictionaryEntryList: React.FC<DictionaryEntryListProps> = ({
  entries,
  loading = false,
  onCreateEntry,
  onEditEntry,
  onDeleteEntry,
}) => {
  const [search, setSearch] = useState('');

  const filtered = entries.filter((e) => {
    const query = search.toLowerCase();
    return e.code.toLowerCase().includes(query) || e.label.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full max-w-md">
          <Icon icon="mdi:magnify" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj po kodzie lub etykiecie..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {onCreateEntry && (
          <button
            type="button"
            onClick={onCreateEntry}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors shrink-0"
          >
            <Icon icon="mdi:plus" className="w-4 h-4" />
            Nowy wiersz
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner message="Wczytywanie słownika..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="mdi:book-open-variant"
          title="Brak wierszy"
          description={
            search
              ? 'Nie znaleziono wierszy pasujących do podanego zapytania.'
              : 'Ten słownik nie ma jeszcze żadnych wierszy.'
          }
          action={
            onCreateEntry && (
              <button
                type="button"
                onClick={onCreateEntry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Icon icon="mdi:plus" className="w-4 h-4" />
                Dodaj pierwszy wiersz
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
                  <th className="px-4 py-3">Kod</th>
                  <th className="px-4 py-3">Etykieta</th>
                  <th className="px-4 py-3">Kolejność</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-900">{entry.code}</td>
                    <td className="px-4 py-3 text-slate-700">{entry.label}</td>
                    <td className="px-4 py-3 text-slate-500">{entry.sort_order}</td>
                    <td className="px-4 py-3">
                      <Badge variant={entry.is_active ? 'success' : 'default'} size="sm">
                        {entry.is_active ? 'Aktywny' : 'Nieaktywny'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onEditEntry && (
                          <button
                            type="button"
                            onClick={() => onEditEntry(entry)}
                            title="Edytuj"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          >
                            <Icon icon="mdi:pencil" className="w-4 h-4" />
                          </button>
                        )}
                        {onDeleteEntry && (
                          <button
                            type="button"
                            onClick={() => onDeleteEntry(entry)}
                            title="Usuń"
                            className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Icon icon="mdi:delete-outline" className="w-4 h-4" />
                          </button>
                        )}
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

export default DictionaryEntryList;
