/**
 * Common types based on OpenAPI specification
 */

export type PrincipalType = 'user' | 'group' | 'role';

export interface UserSummary {
  id: number;
  name?: string | null;
  email?: string | null;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
