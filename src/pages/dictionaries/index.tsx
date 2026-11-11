import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { Icon } from '@iconify/react';
import { useAppDispatch, useAppSelector } from '@/store';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import {
  fetchDictionaryCatalog,
  fetchDictionaryEntries,
  createDictionaryEntry,
  updateDictionaryEntry,
  deleteDictionaryEntry,
  setSelectedDictionaryKey,
} from '@/store/dictionaryEntries';
import { DictionaryEntryList, DictionaryEntryFormModal } from '@/components';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DictionaryEntryRead, DictionaryEntryCreate, DictionaryEntryUpdate } from '@/types/dictionaryEntries';

export default function DictionariesPage() {
  const dispatch = useAppDispatch();
  const isAdmin = useIsAdmin();
  const { catalog, catalogLoading, selectedDictionaryKey, items, loading, saving } = useAppSelector(
    (state) => state.dictionaryEntries
  );

  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<DictionaryEntryRead | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<DictionaryEntryRead | null>(null);

  useEffect(() => {
    dispatch(fetchDictionaryCatalog());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedDictionaryKey && catalog.length > 0) {
      dispatch(setSelectedDictionaryKey(catalog[0].value));
    }
  }, [catalog, selectedDictionaryKey, dispatch]);

  useEffect(() => {
    if (selectedDictionaryKey) {
      dispatch(fetchDictionaryEntries({ dictionary_key: selectedDictionaryKey }));
    }
  }, [selectedDictionaryKey, dispatch]);

  const handleSelectDictionary = (key: string) => {
    dispatch(setSelectedDictionaryKey(key));
  };

  const handleCreate = async (data: DictionaryEntryCreate) => {
    await dispatch(createDictionaryEntry(data)).unwrap();
  };

  const handleUpdate = async (id: string, data: DictionaryEntryUpdate) => {
    if (!selectedDictionaryKey) return;
    await dispatch(updateDictionaryEntry({ id, data, dictionaryKey: selectedDictionaryKey })).unwrap();
  };

  const handleConfirmDelete = async () => {
    if (!entryToDelete || !selectedDictionaryKey) return;
    await dispatch(deleteDictionaryEntry({ id: entryToDelete.id, dictionaryKey: selectedDictionaryKey })).unwrap();
    setEntryToDelete(null);
  };

  return (
    <>
      <Head>
        <title>Słowniki | Galwork Workflow</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Słowniki</h1>
          <p className="text-xs text-slate-500 mt-1">
            Wiersze słowników płaskich (kod/etykieta) używanych w polach formularzy
            (AsyncSelectWidget/TreeSelectWidget).
          </p>
        </div>

        {catalogLoading ? (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
            Wczytywanie katalogu słowników...
          </div>
        ) : catalog.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center text-xs text-slate-500">
            Brak zarejestrowanych słowników płaskich (zob. `TABLE_DICTIONARIES` w galwork-hub:
            wf/services/dictionary_service.py).
          </div>
        ) : (
          <>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Wybierz słownik</label>
              <select
                value={selectedDictionaryKey ?? ''}
                onChange={(e) => handleSelectDictionary(e.target.value)}
                className="w-full max-w-sm text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {catalog.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label} ({entry.value})
                  </option>
                ))}
              </select>
            </div>

            {selectedDictionaryKey && (
              <DictionaryEntryList
                entries={items}
                loading={loading}
                onCreateEntry={
                  isAdmin
                    ? () => {
                        setEntryToEdit(null);
                        setFormModalOpen(true);
                      }
                    : undefined
                }
                onEditEntry={
                  isAdmin
                    ? (entry) => {
                        setEntryToEdit(entry);
                        setFormModalOpen(true);
                      }
                    : undefined
                }
                onDeleteEntry={isAdmin ? (entry) => setEntryToDelete(entry) : undefined}
              />
            )}
          </>
        )}

        {selectedDictionaryKey && (
          <DictionaryEntryFormModal
            isOpen={isFormModalOpen}
            onClose={() => setFormModalOpen(false)}
            dictionaryKey={selectedDictionaryKey}
            entryToEdit={entryToEdit}
            onSubmitCreate={handleCreate}
            onSubmitUpdate={handleUpdate}
            loading={saving}
          />
        )}

        <ConfirmDialog
          isOpen={!!entryToDelete}
          onClose={() => setEntryToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Usunąć wiersz słownika?"
          message={
            entryToDelete
              ? `Wiersz "${entryToDelete.label}" (${entryToDelete.code}) zostanie trwale usunięty.`
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
