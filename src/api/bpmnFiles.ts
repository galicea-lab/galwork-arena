import CONFIG from '@/configs/config'

/**
 * Klient lokalnego serwera plików BPMN (server/bpmn-files.mjs).
 *
 * Służy do bezpośredniej edycji definicji .bpmn w katalogu spiffworkflow/
 * na maszynie, na której uruchomiona jest aplikacja - analogicznie do
 * spiffworkflow-arena w trybie pracy na plikach serwera.
 *
 * Wysyłka do backendu procesowego (nowa wersja draft) odbywa się osobno,
 * przez processModelsApi - zob. processModels.createProcessModelVersion.
 */

const baseUrl = (CONFIG?.bpmn_files_url || '').replace(/\/+$/, '')

export interface BpmnFileListResult {
  root: string
  files: string[]
}

export interface BpmnFileContent {
  path: string
  content: string
}

export interface BpmnFileSaveResult {
  path: string
  saved: boolean
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json()
    if (data && typeof data.detail === 'string') return data.detail
  } catch {
    // brak treści JSON
  }
  return `Błąd serwera plików BPMN (HTTP ${response.status})`
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, init)
  } catch {
    throw new Error(`Brak połączenia z serwerem plików BPMN (${baseUrl}). ` + 'Uruchom: node server/bpmn-files.mjs')
  }
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return (await response.json()) as T
}

export const bpmnFilesApi = {
  /** Lista plików .bpmn w katalogu spiffworkflow/ (ścieżki względne). */
  async listFiles(): Promise<BpmnFileListResult> {
    return requestJson<BpmnFileListResult>(`${baseUrl}/api/bpmn/files`)
  },

  /** Treść pojedynczego pliku .bpmn. */
  async readFile(relativePath: string): Promise<BpmnFileContent> {
    return requestJson<BpmnFileContent>(`${baseUrl}/api/bpmn/file?path=${encodeURIComponent(relativePath)}`)
  },

  /** Zapis treści pliku .bpmn na dysku serwera. */
  async writeFile(relativePath: string, content: string): Promise<BpmnFileSaveResult> {
    return requestJson<BpmnFileSaveResult>(`${baseUrl}/api/bpmn/file`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: relativePath, content })
    })
  }
}

export default bpmnFilesApi
