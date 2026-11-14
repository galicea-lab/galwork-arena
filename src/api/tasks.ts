import { apiClient } from './client';
import {
  HumanTaskRead,
  PageMyTaskItem,
  MyTaskFilterParams,
  TaskClaimRequest,
  TaskCompleteRequest,
} from '@/types/tasks';
import { ProcessInstanceRead } from '@/types/processInstances';

export const tasksApi = {
  /**
   * 2026-11-13: szybka akcja zadania - uruchamia osobną instancję modelu
   * `processModelKey` powiązaną z instancją zadania.
   */
  async runQuickAction(taskId: string, processModelKey: string): Promise<ProcessInstanceRead> {
    const response = await apiClient.post<ProcessInstanceRead>(
      `/tasks/${taskId}/quick-actions/${encodeURIComponent(processModelKey)}`
    );
    return response.data;
  },

  /**
   * Skrzynka zadań: podjęte przez użytkownika oraz otwarte, do których ma prawo.
   */
  async listMyTasks(params?: MyTaskFilterParams): Promise<PageMyTaskItem> {
    const response = await apiClient.get<PageMyTaskItem>('/tasks/my', {
      params,
    });
    return response.data;
  },

  /**
   * Pobiera szczegóły zadania po ID.
   */
  async getTask(taskId: string): Promise<HumanTaskRead> {
    const response = await apiClient.get<HumanTaskRead>(`/tasks/${taskId}`);
    return response.data;
  },

  /**
   * Podjęcie zadania przez zalogowanego użytkownika (claim).
   */
  async claimTask(taskId: string, request: TaskClaimRequest): Promise<HumanTaskRead> {
    const response = await apiClient.post<HumanTaskRead>(`/tasks/${taskId}/claim`, request);
    return response.data;
  },

  /**
   * Wykonuje i kończy zadanie (complete): waliduje dane, wykonuje krok w silniku.
   */
  async completeTask(taskId: string, request: TaskCompleteRequest): Promise<HumanTaskRead> {
    const response = await apiClient.post<HumanTaskRead>(`/tasks/${taskId}/complete`, request);
    return response.data;
  },
};
