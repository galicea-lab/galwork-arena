/**
 * Tasks types based on OpenAPI specification
 */

import { PrincipalType, UserSummary } from './common';

export type HumanTaskStatus = 'open' | 'claimed' | 'completed' | 'cancelled';

export interface HumanTaskCandidate {
  principal_type: PrincipalType;
  principal_value: string;
}

export interface HumanTaskRead {
  id: string;
  process_instance_id: string;
  bpmn_task_id: string;
  name: string;
  lane?: string | null;
  status: HumanTaskStatus;
  claimed_by?: UserSummary | null;
  claimed_at?: string | null;
  priority: number;
  due_at?: string | null;
  created_at: string;
  completed_at?: string | null;
  completed_by?: UserSummary | null;
  completed_on_behalf_of?: UserSummary | null;
  candidates: HumanTaskCandidate[];
}

export interface MyTaskItem {
  id: string;
  name: string;
  status: HumanTaskStatus;
  priority: number;
  due_at?: string | null;
  created_at: string;
  claimed_by_me: boolean;
  on_behalf_of?: UserSummary | null;
  process_instance_id: string;
  process_title: string;
  process_model_name: string;
  business_key?: string | null;
}

export interface PageMyTaskItem {
  items: MyTaskItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface TaskClaimRequest {
  expected_lock_version: number;
}

export interface TaskCompleteRequest {
  data: Record<string, unknown>;
  expected_lock_version: number;
}

export interface MyTaskFilterParams {
  limit?: number;
  offset?: number;
  only_claimed?: boolean;
  overdue?: boolean;
}
