/**
 * Process Instances types based on OpenAPI specification
 */

import { UserSummary } from './common';

export type ProcessInstanceStatus =
  | 'running'
  | 'waiting'
  | 'suspended'
  | 'completed'
  | 'cancelled'
  | 'error';

export interface ProcessInstanceAction {
  expected_lock_version: number;
  reason?: string | null;
}

export interface ProcessInstanceCreate {
  process_model_key: string;
  title: string;
  business_key?: string | null;
  data?: Record<string, unknown>;
  document_ids?: string[];
}

export interface ProcessInstanceRead {
  id: string;
  process_model_version_id: string;
  process_model_key?: string | null;
  process_model_name?: string | null;
  business_key?: string | null;
  title: string;
  status: ProcessInstanceStatus;
  summary: Record<string, unknown>;
  started_by?: UserSummary | null;
  started_at: string;
  completed_at?: string | null;
  updated_at: string;
  error_message?: string | null;
  lock_version: number;
}

export interface PageProcessInstanceRead {
  items: ProcessInstanceRead[];
  total: number;
  limit: number;
  offset: number;
}

export interface ProcessInstanceFilterParams {
  limit?: number;
  offset?: number;
  status?: ProcessInstanceStatus | null;
  process_model_key?: string | null;
}
