import CONFIG from '@/configs/config'

/**
 * Klient lokalnego serwera plików formularzy (server/bpmn-files.mjs).
 *
 * Służy do bezpośredniej edycji par plików JSON Schema + uiSchema w katalogu
 * spiffworkflow/ na maszynie, na której uruchomiona jest aplikacja -
 * analogicznie do edytora BPMN (src/api/bpmnFiles.ts).
 *
 * Serwer rozpoznaje dwie konwencje nazw (mogą współistnieć):
 *   - <nazwa>-schema.json + <nazwa>-uischema.json (SpiffWorkflow/SpiffArena),
 *   - schema.json + ioschema.json .
 *
 * JW 2-11-2026: TO NIE JEST obecnie wykorzystywane - zawsze jest schema.json - jeden formularz na cały obieg.
 * W przyszłości można z ioschema zrezygnować
 */

const baseUrl = (CONFIG?.bpmn_files_url || '').replace(/\/+$/, '')

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

export interface FormFileSaveResult {
  path: string
  saved: boolean
}

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

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json()
    if (data && typeof data.detail === 'string') return data.detail
  } catch {
    // brak treści JSON
  }
  return `Błąd serwera plików formularzy (HTTP ${response.status})`
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, init)
  } catch {
    throw new Error(
      `Brak połączenia z serwerem plików (${baseUrl}). ` + `Uruchom: node server/bpmn-files.mjs`
    )
  }
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return (await response.json()) as T
}

export const formFilesApi = {
  /** Lista par plików formularzy w katalogu spiffworkflow/. */
  async listForms(): Promise<FormFileListResult> {
    return requestJson<FormFileListResult>(`${baseUrl}/api/forms`)
  },

  /** Treść pojedynczego pliku JSON formularza. */
  async readFile(relativePath: string): Promise<FormFileContent> {
    return requestJson<FormFileContent>(`${baseUrl}/api/forms/file?path=${encodeURIComponent(relativePath)}`)
  },

  /** Zapis treści pliku JSON formularza na dysku serwera. */
  async writeFile(relativePath: string, content: string): Promise<FormFileSaveResult> {
    return requestJson<FormFileSaveResult>(`${baseUrl}/api/forms/file`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: relativePath, content })
    })
  }
}

export default formFilesApi
