import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi } from "@/api/clients";
import type {
  UpdateClientPayload,
  UpdateAddressPayload,
  AddAddressPayload,
  AddContactPayload,
  UpdateContactPayload,
} from "@/api/clients";
import { toast } from "sonner";

/** Invalidates ["client", id] after every successful mutation */
const useClientMutation = <TVariables>(
  id: string,
  mutationFn: (vars: TVariables) => Promise<unknown>,
  successMessage: string,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", id] });
      toast.success(successMessage);
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });
};

// ── Client ────────────────────────────────────────────────────────────────────

export const useUpdateClientBasic = (id: string) =>
  useClientMutation<UpdateClientPayload>(
    id,
    (payload) => clientsApi.update(id, payload),
    "Client updated",
  );

export const useUpdateClientSalesperson = (id: string) =>
  useClientMutation<string>(
    id,
    (salespersonPositionId) => clientsApi.updateSalesperson(id, salespersonPositionId),
    "Salesperson updated",
  );

// ── Addresses ─────────────────────────────────────────────────────────────────

export const useAddAddress = (id: string) =>
  useClientMutation<AddAddressPayload>(
    id,
    (payload) => clientsApi.addAddress(id, payload),
    "Address added",
  );

export const useUpdateAddress = (id: string) =>
  useClientMutation<{ addressId: string; payload: UpdateAddressPayload }>(
    id,
    ({ addressId, payload }) => clientsApi.updateAddress(id, addressId, payload),
    "Address updated",
  );

export const useDeleteAddress = (id: string) =>
  useClientMutation<string>(
    id,
    (addressId) => clientsApi.deleteAddress(id, addressId),
    "Address deleted",
  );

// ── Contacts ──────────────────────────────────────────────────────────────────

export const useAddContact = (id: string) =>
  useClientMutation<{ addressId: string; payload: AddContactPayload }>(
    id,
    ({ addressId, payload }) => clientsApi.addContact(id, addressId, payload),
    "Contact added",
  );

export const useUpdateContact = (id: string) =>
  useClientMutation<{ addressId: string; contactId: string; payload: UpdateContactPayload }>(
    id,
    ({ addressId, contactId, payload }) =>
      clientsApi.updateContact(id, addressId, contactId, payload),
    "Contact updated",
  );

export const useDeleteContact = (id: string) =>
  useClientMutation<{ addressId: string; contactId: string }>(
    id,
    ({ addressId, contactId }) => clientsApi.deleteContact(id, addressId, contactId),
    "Contact deleted",
  );

export const useAddNote = (id: string) =>
  useClientMutation<string>(id, (content) => clientsApi.addNote(id, content), "Note added");

export const useUpdateNote = (id: string) =>
  useClientMutation<{ noteId: string; content: string }>(
    id,
    ({ noteId, content }) => clientsApi.updateNote(id, noteId, content),
    "Note updated",
  );

export const useDeleteNote = (id: string) =>
  useClientMutation<string>(id, (noteId) => clientsApi.deleteNote(id, noteId), "Note deleted");
