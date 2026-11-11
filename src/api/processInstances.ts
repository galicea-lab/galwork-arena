import { apiClient } from './client';
import {
  ProcessInstanceRead,
  ProcessInstanceCreate,
  ProcessInstanceAction,
  PageProcessInstanceRead,
  ProcessInstanceFilterParams,
} from '@/types/processInstances';

export const processInstancesApi = {
  /**
   * Pobiera stronicowaną listę instancji procesów z opcjonalnymi filtrami.
   */
  async listProcessInstances(
    params?: ProcessInstanceFilterParams
  ): Promise<PageProcessInstanceRead> {
    const response = await apiClient.get<PageProcessInstanceRead>('/process-instances', {
      params,
    });
    return response.data;
  },

  /**
   * Pobiera szczegóły pojedynczej instancji procesu.
   */
  async getProcessInstance(instanceId: string): Promise<ProcessInstanceRead> {
    const response = await apiClient.get<ProcessInstanceRead>(`/process-instances/${instanceId}`);
    return response.data;
  },

  /**
   * Startuje nową instancję procesu w silniku BPMN i zapisuje jej stan.
   */
  async startProcessInstance(data: ProcessInstanceCreate): Promise<ProcessInstanceRead> {
    const response = await apiClient.post<ProcessInstanceRead>('/process-instances', data);
    return response.data;
  },

  /**
   * Anuluje instancję procesu.
   */
  async cancelProcessInstance(
    instanceId: string,
    action: ProcessInstanceAction
  ): Promise<ProcessInstanceRead> {
    const response = await apiClient.post<ProcessInstanceRead>(
      `/process-instances/${instanceId}/cancel`,
      action
    );
    return response.data;
  },

  /**
   * Wstrzymuje (suspend) instancję procesu.
   */
  async suspendProcessInstance(
    instanceId: string,
    action: ProcessInstanceAction
  ): Promise<ProcessInstanceRead> {
    const response = await apiClient.post<ProcessInstanceRead>(
      `/process-instances/${instanceId}/suspend`,
      action
    );
    return response.data;
  },

  /**
   * Wznawia (resume) instancję procesu.
   */
  async resumeProcessInstance(
    instanceId: string,
    action: ProcessInstanceAction
  ): Promise<ProcessInstanceRead> {
    const response = await apiClient.post<ProcessInstanceRead>(
      `/process-instances/${instanceId}/resume`,
      action
    );
    return response.data;
  },
};
