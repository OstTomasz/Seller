import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi } from "@/api/clients";
import type { CreateClientPayload } from "@/api/clients";
import { toast } from "sonner";

/**
 * Mutation for creating a new client.
 * Invalidates ["clients"] on success.
 */
export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClientPayload) => clientsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client created");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });
};
