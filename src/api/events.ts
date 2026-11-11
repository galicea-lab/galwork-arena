import { apiClient } from './client';
import { EventsResponse, EventsFilterParams } from '@/types/events';

export const eventsApi = {
  /**
   * Pobieranie listy zdarzeń dla danej osoby we wskazanym zakresie dat (start, end).
   */
  async getEvents(params: EventsFilterParams): Promise<EventsResponse> {
    const response = await apiClient.get<EventsResponse>('/', {
      params,
    });
    return response.data;
  },
};
