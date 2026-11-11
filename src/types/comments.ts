/**
 * Comments types based on OpenAPI specification
 */

import { UserSummary } from './common';

export interface CommentCreate {
  body: string;
  human_task_id?: string | null;
  document_id?: string | null;
}

export interface CommentRead {
  id: string;
  process_instance_id: string;
  human_task_id?: string | null;
  document_id?: string | null;
  author: UserSummary;
  body: string;
  created_at: string;
}
