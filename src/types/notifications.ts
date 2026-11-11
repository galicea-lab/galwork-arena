/**
 * Notifications types based on OpenAPI specification
 */

export interface NotificationRead {
  id: number;
  kind: string;
  title: string;
  link?: string | null;
  payload?: Record<string, unknown>;
  created_at: string;
  read_at?: string | null;
}

export interface NotificationMarkRead {
  ids: number[];
}

export interface NotificationFilterParams {
  unread_only?: boolean;
  limit?: number;
}
