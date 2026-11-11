import { apiClient } from './client';
import {
  ProcessModelRead,
  ProcessModelCreate,
  ProcessModelUpdate,
  ProcessModelVersionRead,
  ProcessModelVersionCreate,
  ProcessModelFileContent,
  ProcessModelFilterParams,
  ProcessModelSyncResult,
} from '@/types/processModels';

export const processModelsApi = {
  /**
   * Pobiera listę modeli procesów.
   */
  async listProcessModels(params?: ProcessModelFilterParams): Promise<ProcessModelRead[]> {
    const response = await apiClient.get<ProcessModelRead[]>('/process-models', {
      params,
    });
    return response.data;
  },

  /**
   * Skanuje całe drzewo spiffworkflow/ na backendzie i tworzy/aktualizuje
   * wersje `draft` dla zmienionych obiegów (admin-only). Nigdy nie publikuje.
   */
  async syncProcessModelsFromDisk(dryRun = false): Promise<ProcessModelSyncResult[]> {
    const response = await apiClient.post<ProcessModelSyncResult[]>(
      '/process-models/sync-from-disk',
      { dry_run: dryRun }
    );
    return response.data;
  },

  /**
   * Pobiera szczegóły modelu procesu po ID.
   */
  async getProcessModel(processModelId: string): Promise<ProcessModelRead> {
    const response = await apiClient.get<ProcessModelRead>(`/process-models/${processModelId}`);
    return response.data;
  },

  /**
   * Tworzy nowy model procesu.
   */
  async createProcessModel(data: ProcessModelCreate): Promise<ProcessModelRead> {
    const response = await apiClient.post<ProcessModelRead>('/process-models', data);
    return response.data;
  },

  /**
   * Aktualizuje istniejący model procesu.
   */
  async updateProcessModel(
    processModelId: string,
    data: ProcessModelUpdate
  ): Promise<ProcessModelRead> {
    const response = await apiClient.patch<ProcessModelRead>(
      `/process-models/${processModelId}`,
      data
    );
    return response.data;
  },

  /**
   * Pobiera listę wersji danego modelu procesu.
   */
  async listProcessModelVersions(processModelId: string): Promise<ProcessModelVersionRead[]> {
    const response = await apiClient.get<ProcessModelVersionRead[]>(
      `/process-models/${processModelId}/versions`
    );
    return response.data;
  },

  /**
   * Treść jednego pliku wersji (JSON Schema/UI Schema/BPMN) - listy plików
   * (`listProcessModelVersions`) celowo nie mają `content`.
   */
  async getProcessModelFileContent(
    processModelId: string,
    versionId: string,
    fileId: string
  ): Promise<ProcessModelFileContent> {
    const response = await apiClient.get<ProcessModelFileContent>(
      `/process-models/${processModelId}/versions/${versionId}/files/${fileId}`
    );
    return response.data;
  },

  /**
   * Tworzy nową wersję roboczą (status=draft) z plikami BPMN/DMN/schema.
   */
  async createProcessModelVersion(
    processModelId: string,
    data: ProcessModelVersionCreate
  ): Promise<ProcessModelVersionRead> {
    const response = await apiClient.post<ProcessModelVersionRead>(
      `/process-models/${processModelId}/versions`,
      data
    );
    return response.data;
  },

  /**
   * Publikuje wersję modelu procesu; cofa poprzednio opublikowaną wersję.
   */
  async publishProcessModelVersion(
    processModelId: string,
    versionId: string
  ): Promise<ProcessModelVersionRead> {
    const response = await apiClient.post<ProcessModelVersionRead>(
      `/process-models/${processModelId}/versions/${versionId}/publish`
    );
    return response.data;
  },
};
