import { apiClient } from '@/api/client'
import { readProcessFile, writeProcessFile, ProcessFileSaveResult } from '@/api/processFiles'

/**
 * Klient plików formularzy w katalogu obiegów huba (/v1/wf/process-files).
 * 2026-11-15: zastąpił lokalny serwer server/bpmn-files.mjs.
 *
 * Służy do edycji par plików JSON Schema + uiSchema, analogicznie do edytora
 * BPMN (src/api/bpmnFiles.ts).
 *
 * Hub rozpoznaje dwie konwencje nazw (mogą współistnieć):
 *   - <nazwa>-schema.json + <nazwa>-uischema.json (SpiffWorkflow/SpiffArena),
 *   - schema.json + ioschema.json .
 *
 * JW 2-11-2026: TO NIE JEST obecnie wykorzystywane - zawsze jest schema.json - jeden formularz na cały obieg.
 * W przyszłości można z ioschema zrezygnować
 */

export interface FormFilePair {
  /** Katalog względem spiffworkflow/ ('' dla katalogu głównego). */
  dir: string
  /** Wspólny prefiks nazw plików ('' dla schema.json/ioschema.json). */
  base: string
  /** Ścieżka pliku JSON Schema (null, gdy plik jeszcze nie istnieje). */
  schemaPath: string | null
  /** Ścieżka pliku uiSchema (null, gdy plik jeszcze nie istnieje). */
  uiSchemaPath: string | null
}

export interface FormFileListResult {
  root: string
  forms: FormFilePair[]
}

export interface FormFileContent {
  path: string
  content: string
}

export type FormFileSaveResult = ProcessFileSaveResult

/** Stabilny klucz pary formularza używany do zaznaczania na liście. */
export function formPairKey(pair: FormFilePair): string {
  return `${pair.dir}::${pair.base}`
}

/** Domyślna ścieżka brakującego pliku schema (konwencja "-schema"). */
export function defaultSchemaPath(pair: FormFilePair): string {
  const name = pair.base ? `${pair.base}-schema.json` : 'schema.json'
  return pair.dir ? `${pair.dir}/${name}` : name
}

/** Domyślna ścieżka brakującego pliku uiSchema (konwencja "-uischema"). */
export function defaultUiSchemaPath(pair: FormFilePair): string {
  const name = pair.base ? `${pair.base}-uischema.json` : 'ioschema.json'
  return pair.dir ? `${pair.dir}/${name}` : name
}

export const formFilesApi = {
  /** Lista par plików formularzy w katalogu obiegów. */
  async listForms(): Promise<FormFileListResult> {
    const { data } = await apiClient.get<FormFileListResult>('/process-files/forms')
    return data
  },

  /** Treść pojedynczego pliku JSON formularza. */
  async readFile(relativePath: string): Promise<FormFileContent> {
    return readProcessFile(relativePath)
  },

  /** Zapis treści pliku JSON formularza (hub waliduje, zapisuje i commituje). */
  async writeFile(relativePath: string, content: string): Promise<FormFileSaveResult> {
    return writeProcessFile(relativePath, content)
  }
}

export default formFilesApi
