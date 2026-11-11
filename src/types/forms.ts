/**
 * Formularze Spiff-Arena (RJSF): JSON Schema + uiSchema renderowane po stronie serwera.
 *
 * Pobierane z galwork-hub przez API: `GET /tasks/{id}/form` oraz
 * `GET /process-models/{key}/start-form`.
 */

import type { RJSFSchema, UiSchema } from '@rjsf/utils';

/** Wersja dokumentu podpiętego pod zadanie (min. pola potrzebne na liście). */
export interface TaskFormDocumentVersion {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
}

/** Dokument powiązany z zadaniem (DocumentRead ograniczony do widoku formularza). */
export interface TaskFormDocument {
  id: string;
  doc_type: string;
  title: string;
  registry_number?: string | null;
  status?: string;
  current_version_no?: number | null;
  current_version?: TaskFormDocumentVersion | null;
}

/** Odpowiedź `GET /tasks/{task_id}/form` (TaskFormRead). */
export interface TaskFormRead {
  task_id: string;
  task_name: string;
  json_schema: RJSFSchema;
  ui_schema: UiSchema;
  form_data: Record<string, unknown>;
  documents: TaskFormDocument[];
  process_lock_version: number;
}

/** Odpowiedź `GET /process-models/{process_model_key}/start-form` (ProcessFormRead). */
export interface ProcessFormRead {
  process_model_key: string;
  bpmn_task_id?: string | null;
  json_schema: RJSFSchema;
  ui_schema: UiSchema;
  form_data: Record<string, unknown>;
}

/** Pusty schemat = brak formularza po stronie serwera -> zapasowy edytor JSON. */
export const hasFormSchema = (schema?: RJSFSchema | null): boolean =>
  Boolean(schema) && Object.keys(schema as Record<string, unknown>).length > 0;
