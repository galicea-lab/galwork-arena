import { apiClient } from './client';
import { ProcessFormRead, TaskFormRead } from '@/types/forms';

/**
 * Formularze Spiff-Arena (RJSF) zwracane przez backend.
 */
export const formsApi = {
  /**
   * Formularz zadania ludzkiego: schemat, uiSchema, dane wstępne, wersja blokady.
   */
  async getTaskForm(taskId: string): Promise<TaskFormRead> {
    const response = await apiClient.get<TaskFormRead>(`/tasks/${taskId}/form`);
    return response.data;
  },

  /**
   * Formularz startowy procesu (startEvent) dla podanego klucza modelu.
   */
  async getStartForm(processModelKey: string): Promise<ProcessFormRead> {
    const response = await apiClient.get<ProcessFormRead>(
      `/process-models/${encodeURIComponent(processModelKey)}/start-form`
    );
    return response.data;
  },
};
