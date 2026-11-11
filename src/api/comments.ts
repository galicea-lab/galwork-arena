import { apiClient } from './client';
import { CommentRead, CommentCreate } from '@/types/comments';

export const commentsApi = {
  /**
   * Pobiera listę komentarzy dla danej instancji procesu.
   */
  async listComments(instanceId: string): Promise<CommentRead[]> {
    const response = await apiClient.get<CommentRead[]>(
      `/process-instances/${instanceId}/comments`
    );
    return response.data;
  },

  /**
   * Dodaje nowy komentarz do instancji procesu.
   */
  async createComment(instanceId: string, data: CommentCreate): Promise<CommentRead> {
    const response = await apiClient.post<CommentRead>(
      `/process-instances/${instanceId}/comments`,
      data
    );
    return response.data;
  },
};
