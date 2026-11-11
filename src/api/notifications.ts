import { apiClient } from './client';
import {
  NotificationRead,
  NotificationMarkRead,
  NotificationFilterParams,
} from '@/types/notifications';

export const notificationsApi = {
  /**
   * Pobiera listę powiadomień użytkownika.
   */
  async listNotifications(params?: NotificationFilterParams): Promise<NotificationRead[]> {
    const response = await apiClient.get<NotificationRead[]>('/notifications', {
      params,
    });
    return response.data;
  },

  /**
   * Oznacza powiadomienia jako przeczytane.
   */
  async markNotificationsRead(data: NotificationMarkRead): Promise<Record<string, unknown>> {
    const response = await apiClient.post<Record<string, unknown>>(
      '/notifications/mark-read',
      data
    );
    return response.data;
  },
};
