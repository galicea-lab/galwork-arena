import { apiClient } from '@/api/client'
import { readProcessFile, writeProcessFile, ProcessFileSaveResult } from '@/api/processFiles'

/* 2026-11-15: klient plików .bpmn w katalogu obiegów huba
 * (GET/PUT /v1/wf/process-files...) - zastąpił server/bpmn-files.mjs.
 *
 * Wysyłka do backendu procesowego (nowa wersja draft) odbywa się osobno,
 * przez processModelsApi - zob. processModels.createProcessModelVersion. */

export interface BpmnFileListResult {
  root: string
  files: string[]
}

export interface BpmnFileContent {
  path: string
  content: string
}

export type BpmnFileSaveResult = ProcessFileSaveResult

interface ProcessFileList {
  root: string
  files: { path: string; kind: string }[]
}

export const bpmnFilesApi = {
  /** Lista plików .bpmn w katalogu obiegów (ścieżki względne). */
  async listFiles(): Promise<BpmnFileListResult> {
    const { data } = await apiClient.get<ProcessFileList>('/process-files', { params: { kind: 'bpmn' } })
    return { root: data.root, files: data.files.map(file => file.path) }
  },

  /** Treść pojedynczego pliku .bpmn. */
  async readFile(relativePath: string): Promise<BpmnFileContent> {
    return readProcessFile(relativePath)
  },

  /** Zapis treści pliku .bpmn (hub waliduje, zapisuje i commituje). */
  async writeFile(relativePath: string, content: string): Promise<BpmnFileSaveResult> {
    return writeProcessFile(relativePath, content)
  }
}

export default bpmnFilesApi
