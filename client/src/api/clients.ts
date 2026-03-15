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

export const clientsApi = {
  getAll: () =>
    api.get<GetClientsResponse>("/clients"),

  getById: (id: string) =>
    api.get<GetClientByIdResponse>(`/clients/${id}`),

  create: (payload: CreateClientPayload) =>
    api.post<{ client: Client }>("/clients", payload),

  update: (id: string, payload: UpdateClientPayload) =>
    api.patch<{ client: Client }>(`/clients/${id}`, payload),

  updateStatus: (id: string, payload: UpdateClientStatusPayload) =>
    api.patch<{ client: Client }>(`/clients/${id}/status`, payload),

  requestArchive: (id: string, payload: RequestArchivePayload) =>
    api.patch<{ client: Client }>(`/clients/${id}/archive-request`, payload),

  approveArchive: (id: string) =>
    api.patch<{ client: Client }>(`/clients/${id}/archive-approve`),

  unarchive: (id: string) =>
    api.patch<{ client: Client }>(`/clients/${id}/unarchive`),
};