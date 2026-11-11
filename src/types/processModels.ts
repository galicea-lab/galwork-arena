/**
 * Process Models types based on OpenAPI specification
 */

export type ProcessFileType = 'bpmn' | 'dmn' | 'json_schema' | 'ui_schema' | 'other';

export type ProcessModelVersionStatus = 'draft' | 'published' | 'retired';

export interface ProcessModelCreate {
  key: string;
  name: string;
  description?: string | null;
  category?: string | null;
}

export interface ProcessModelUpdate {
  name?: string | null;
  description?: string | null;
  category?: string | null;
  is_active?: boolean | null;
}

export interface ProcessModelRead {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  category?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ProcessModelFileCreate {
  file_name: string;
  file_type: ProcessFileType;
  content: string;
}

export interface ProcessModelFileRead {
  id: string;
  file_name: string;
  file_type: ProcessFileType;
  sha256: string;
}

/** `GET /process-models/{id}/versions/{v}/files/{f}` - jedyne miejsce, gdzie
 * backend zwraca `content` pliku wersji (listy plików go celowo nie mają). */
export interface ProcessModelFileContent extends ProcessModelFileRead {
  content: string;
}

export interface ProcessModelVersionCreate {
  bpmn_process_id: string;
  files: ProcessModelFileCreate[];
}

export interface ProcessModelVersionRead {
  id: string;
  process_model_id: string;
  version: number;
  status: ProcessModelVersionStatus;
  bpmn_process_id: string;
  content_hash: string;
  published_at?: string | null;
  published_by?: string | null;
  created_at: string;
  files?: ProcessModelFileRead[];
}

export interface ProcessModelFilterParams {
  active_only?: boolean;
}

/** `POST /process-models/sync-from-disk` (admin-only) - zob.
 * wf/services/filesystem_sync.py. Tworzy/aktualizuje tylko wersje `draft`. */
export interface ProcessModelSyncResult {
  folder: string;
  key: string;
  status: 'unchanged' | 'draft-created' | 'would-create-model' | 'would-create-draft' | 'error' | string;
  detail: string;
}
