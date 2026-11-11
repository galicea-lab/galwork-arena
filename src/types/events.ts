/**
 * Events types based on OpenAPI specification
 */

export interface EventItem {
  id?: string;
  url?: string;
  title?: string;
  allDay?: boolean;
  start?: string;
  end?: string;
  organizer?: string;
  extendedProps: Record<string, unknown>;
}

export interface EventsResponse {
  code?: number;
  message?: string;
  events?: EventItem[] | null;
}

export interface EventsFilterParams {
  start: string;
  end: string;
  user?: string;
}
