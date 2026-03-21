import { api } from "@/lib/axios";
import { Client } from "@/types";

export interface GetClientsResponse {
  clients: Client[];
}

export interface GetClientByIdResponse {
  client: Client;
}

export interface CreateClientPayload {
  companyName: string;
  nip?: string | null;
  notes?: string | null;
  addresses: {
    label: string;
    street: string;
    city: string;
    postalCode: string;
    contacts?: {
      firstName: string;
      lastName: string;
      phone?: string | null;
      email?: string | null;
    }[];
  }[];
  salespersonPositionId?: string;
}

export interface UpdateClientPayload {
  companyName?: string;
  nip?: string | null;
  notes?: string | null;
}

export interface UpdateClientStatusPayload {
  status: string;
  inactivityReason?: string | null;
}

export interface RequestArchivePayload {
  reason: string;
}

export interface UpdateAddressPayload {
  label?: string;
  street?: string;
  city?: string;
  postalCode?: string;
}

export interface AddAddressPayload {
  label: string;
  street: string;
  city: string;
  postalCode: string;
}

export interface AddContactPayload {
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
}

export interface UpdateContactPayload {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
}

export const clientsApi = {
  getAll: () => api.get<GetClientsResponse>("/clients"),

  getById: (id: string) => api.get<GetClientByIdResponse>(`/clients/${id}`),

  create: (payload: CreateClientPayload) => api.post<{ client: Client }>("/clients", payload),

  update: (id: string, payload: UpdateClientPayload) =>
    api.patch<{ client: Client }>(`/clients/${id}`, payload),

  updateStatus: (id: string, payload: UpdateClientStatusPayload) =>
    api.patch<{ client: Client }>(`/clients/${id}/status`, payload),

  approveArchive: (id: string) => api.patch<{ client: Client }>(`/clients/${id}/archive-approve`),

  updateSalesperson: (id: string, salespersonPositionId: string) =>
    api.patch<{ client: Client }>(`/clients/${id}/salesperson`, { salespersonPositionId }),

  addAddress: (id: string, payload: AddAddressPayload) =>
    api.post<{ client: Client }>(`/clients/${id}/addresses`, payload),

  updateAddress: (id: string, addressId: string, payload: UpdateAddressPayload) =>
    api.patch<{ client: Client }>(`/clients/${id}/addresses/${addressId}`, payload),

  deleteAddress: (id: string, addressId: string) =>
    api.delete<{ client: Client }>(`/clients/${id}/addresses/${addressId}`),

  addContact: (id: string, addressId: string, payload: AddContactPayload) =>
    api.post<{ client: Client }>(`/clients/${id}/addresses/${addressId}/contacts`, payload),

  updateContact: (
    id: string,
    addressId: string,
    contactId: string,
    payload: UpdateContactPayload,
  ) =>
    api.patch<{ client: Client }>(
      `/clients/${id}/addresses/${addressId}/contacts/${contactId}`,
      payload,
    ),

  deleteContact: (id: string, addressId: string, contactId: string) =>
    api.delete<{ client: Client }>(`/clients/${id}/addresses/${addressId}/contacts/${contactId}`),

  addNote: (id: string, content: string) =>
    api.post<{ client: Client }>(`/clients/${id}/notes`, { content }),

  updateNote: (id: string, noteId: string, content: string) =>
    api.patch<{ client: Client }>(`/clients/${id}/notes/${noteId}`, { content }),

  deleteNote: (id: string, noteId: string) =>
    api.delete<{ client: Client }>(`/clients/${id}/notes/${noteId}`),

  checkNip: (nip: string) =>
    api.get<{ archived: boolean; clientId: string | null; companyName: string | null }>(
      `/clients/check-nip/${nip}`,
    ),

  requestUnarchive: (clientId: string) =>
    api.post<{ message: string }>(`/notifications/unarchive-request`, { clientId }),

  requestArchive: (id: string, payload: RequestArchivePayload) =>
    api.patch<{ client: Client }>(`/clients/${id}/archive-request`, payload),

  directArchive: (id: string, reason: string) =>
    api.patch<{ client: Client }>(`/clients/${id}/direct-archive`, { reason }),

  rejectArchive: (id: string, reason: string) =>
    api.patch<{ client: Client }>(`/clients/${id}/archive-reject`, { reason }),

  unarchive: (id: string, reason: string) =>
    api.patch<{ client: Client }>(`/clients/${id}/unarchive`, { reason }),

  rejectUnarchive: (id: string, reason: string) =>
    api.patch<{ message: string }>(`/clients/${id}/unarchive-reject`, { reason }),
};
