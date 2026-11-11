/**
 * Kontrahenci i ich adresy - tabele `contact`/`contact_address` w
 * galwork-hub (wf/models/wf.py). Zob. wf/routers/contact_api.py.
 */

export interface ContactAddressRead {
  id: string;
  contact_id: string;
  label: string;
  ade?: string | null;
  is_primary: boolean;
  valid_from?: string | null;
  address: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ContactAddressCreate {
  label: string;
  ade?: string | null;
  is_primary?: boolean;
  valid_from?: string | null;
  address?: Record<string, unknown>;
}

export interface ContactAddressUpdate {
  label?: string;
  ade?: string | null;
  is_primary?: boolean;
  valid_from?: string | null;
  address?: Record<string, unknown>;
}

export interface ContactRead {
  id: string;
  nip?: string | null;
  pesel?: string | null;
  krs?: string | null;
  regon?: string | null;
  company_name?: string | null;
  last_name?: string | null;
  first_name?: string | null;
  title?: string | null;
  legal_form?: string | null;
  assigned_operator?: string | null;
  is_active: boolean;
  extra: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  addresses: ContactAddressRead[];
}

export interface ContactCreate {
  nip?: string | null;
  pesel?: string | null;
  krs?: string | null;
  regon?: string | null;
  company_name?: string | null;
  last_name?: string | null;
  first_name?: string | null;
  title?: string | null;
  legal_form?: string | null;
  assigned_operator?: string | null;
  is_active?: boolean;
}

export interface ContactUpdate {
  nip?: string | null;
  pesel?: string | null;
  krs?: string | null;
  regon?: string | null;
  company_name?: string | null;
  last_name?: string | null;
  first_name?: string | null;
  title?: string | null;
  legal_form?: string | null;
  assigned_operator?: string | null;
  is_active?: boolean;
}

export interface ContactPage {
  items: ContactRead[];
  total: number;
}

export interface ContactFilterParams {
  q?: string;
  active_only?: boolean;
  limit?: number;
  offset?: number;
}
