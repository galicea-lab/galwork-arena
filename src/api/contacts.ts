import { apiClient } from './client';
import {
  ContactAddressCreate,
  ContactAddressRead,
  ContactAddressUpdate,
  ContactCreate,
  ContactFilterParams,
  ContactPage,
  ContactRead,
  ContactUpdate,
} from '@/types/contacts';

export const contactsApi = {
  async listContacts(params?: ContactFilterParams): Promise<ContactPage> {
    const response = await apiClient.get<ContactPage>('/contacts', { params });
    return response.data;
  },

  async getContact(id: string): Promise<ContactRead> {
    const response = await apiClient.get<ContactRead>(`/contacts/${id}`);
    return response.data;
  },

  /** Admin-only po stronie huba (require_process_admin). */
  async createContact(data: ContactCreate): Promise<ContactRead> {
    const response = await apiClient.post<ContactRead>('/contacts', data);
    return response.data;
  },

  async updateContact(id: string, data: ContactUpdate): Promise<ContactRead> {
    const response = await apiClient.patch<ContactRead>(`/contacts/${id}`, data);
    return response.data;
  },

  async deleteContact(id: string): Promise<void> {
    await apiClient.delete(`/contacts/${id}`);
  },

  async createAddress(contactId: string, data: ContactAddressCreate): Promise<ContactAddressRead> {
    const response = await apiClient.post<ContactAddressRead>(`/contacts/${contactId}/addresses`, data);
    return response.data;
  },

  async updateAddress(addressId: string, data: ContactAddressUpdate): Promise<ContactAddressRead> {
    const response = await apiClient.patch<ContactAddressRead>(`/contact-addresses/${addressId}`, data);
    return response.data;
  },

  async deleteAddress(addressId: string): Promise<void> {
    await apiClient.delete(`/contact-addresses/${addressId}`);
  },
};
