import { apiClient } from './client';
import {
  DictionaryCatalogEntry,
  DictionaryEntryCreate,
  DictionaryEntryFilterParams,
  DictionaryEntryPage,
  DictionaryEntryRead,
  DictionaryEntryUpdate,
} from '@/types/dictionaryEntries';

export const dictionaryEntriesApi = {
  /**
   * Znane słowniki płaskie (tabela `dictionary_entry`) - do wyboru w
   * ekranie admina, zob. wf/services/dictionary_service.py::TABLE_DICTIONARIES.
   */
  async listCatalog(): Promise<DictionaryCatalogEntry[]> {
    const response = await apiClient.get<DictionaryCatalogEntry[]>('/dictionary-entries/catalog');
    return response.data;
  },

  async listEntries(params: DictionaryEntryFilterParams): Promise<DictionaryEntryPage> {
    const response = await apiClient.get<DictionaryEntryPage>('/dictionary-entries', { params });
    return response.data;
  },

  /** Admin-only po stronie huba (require_process_admin) - zwraca 403, jeśli nie admin. */
  async createEntry(data: DictionaryEntryCreate): Promise<DictionaryEntryRead> {
    const response = await apiClient.post<DictionaryEntryRead>('/dictionary-entries', data);
    return response.data;
  },

  async updateEntry(id: string, data: DictionaryEntryUpdate): Promise<DictionaryEntryRead> {
    const response = await apiClient.patch<DictionaryEntryRead>(`/dictionary-entries/${id}`, data);
    return response.data;
  },

  async deleteEntry(id: string): Promise<void> {
    await apiClient.delete(`/dictionary-entries/${id}`);
  },
};
