/**
 * Słowniki płaskie (kod/etykieta) - tabela `dictionary_entry` w galwork-hub
 * (wf/models/wf.py::DictionaryEntry). Zob. wf/routers/dictionary_entry_api.py.
 */

export interface DictionaryCatalogEntry {
  /** = `dictionary_key` używany w pozostałych wywołaniach tego API. */
  value: string;
  label: string;
}

export interface DictionaryEntryRead {
  id: string;
  dictionary_key: string;
  code: string;
  label: string;
  sort_order: number;
  is_active: boolean;
  extra: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DictionaryEntryCreate {
  dictionary_key: string;
  code: string;
  label: string;
  sort_order?: number;
  is_active?: boolean;
  extra?: Record<string, unknown>;
}

export interface DictionaryEntryUpdate {
  code?: string;
  label?: string;
  sort_order?: number;
  is_active?: boolean;
  extra?: Record<string, unknown>;
}

export interface DictionaryEntryPage {
  items: DictionaryEntryRead[];
  total: number;
}

export interface DictionaryEntryFilterParams {
  dictionary_key: string;
  q?: string;
  active_only?: boolean;
  limit?: number;
  offset?: number;
}
