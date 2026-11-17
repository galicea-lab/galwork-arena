import { apiClient } from '@/api/client'

/* 2026-11-15: wspólny klient API plików obiegów galwork-hub
 * (/v1/wf/process-files) - zastępuje lokalny serwer server/bpmn-files.mjs.
 * Żądania idą przez apiClient (token Keycloak), uprawnienia sprawdza hub
 * (grupa administracyjna procesów).
 *
 * Blokada optymistyczna: hub odrzuca zapis (409), jeśli plik na serwerze
 * zmienił się od chwili odczytu. Klient pamięta sha256 ostatnio odczytanej
 * lub zapisanej treści każdego pliku i dołącza je do zapisu - strony
 * edytorów nie muszą go przekazywać. Plik bez znanego sha256 jest
 * zapisywany jako nowy. */

export type ProcessFileKind = 'bpmn' | 'form' | 'print'

export interface ProcessFileContent {
  path: string
  kind: ProcessFileKind
  content: string
  sha256: string
}

export interface ProcessFileSaveResult {
  path: string
  kind: ProcessFileKind
  sha256: string
  saved: boolean
  created: boolean
  /** Zastrzeżenia walidacji, które nie zablokowały zapisu. */
  warnings: string[]
  /** Czy zmiana trafiła do repozytorium Git katalogu obiegów. */
  committed: boolean
  commit: string | null
  git_error: string | null
}

const knownSha = new Map<string, string>()

export async function readProcessFile(path: string): Promise<ProcessFileContent> {
  const { data } = await apiClient.get<ProcessFileContent>('/process-files/content', { params: { path } })
  knownSha.set(data.path, data.sha256)
  return data
}

export async function writeProcessFile(path: string, content: string): Promise<ProcessFileSaveResult> {
  const { data } = await apiClient.put<ProcessFileSaveResult>('/process-files/content', {
    path,
    content,
    base_sha256: knownSha.get(path) ?? null
  })
  knownSha.set(data.path, data.sha256)
  return data
}

/** Komunikat po zapisie: ostrzeżenia walidacji i błąd commita, jeśli wystąpiły. */
export function describeSave(results: ProcessFileSaveResult[]): string {
  const notes = results.flatMap(result => [
    ...result.warnings.map(warning => `${result.path}: ${warning}`),
    ...(result.git_error ? [`${result.path}: zapisano, ale commit nie powiódł się (${result.git_error})`] : [])
  ])
  return notes.length ? ` Uwagi: ${notes.join('; ')}` : ''
}
