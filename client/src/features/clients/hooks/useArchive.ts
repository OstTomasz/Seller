import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi } from "@/api/clients";
import { toast } from "sonner";
import { Client } from "@/types";
import { queryKeys } from "@/lib/queryKeys";

const useClientMutation = <TVariables>(
  mutationFn: (vars: TVariables) => Promise<unknown>,
  successMessage: string,
  invalidateKeys: ReadonlyArray<ReadonlyArray<string>>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      toast.success(successMessage);
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });
};

/** Salesperson — sends archive request with reason */
export const useRequestArchive = () =>
  useClientMutation<{ clientId: string; reason: string }>(
    ({ clientId, reason }) => clientsApi.requestArchive(clientId, { reason }),
    "Archive request sent",
    [queryKeys.clients.all()],
  );

/** Deputy / Director — archives directly with reason */
export const useDirectArchive = () =>
  useClientMutation<{ clientId: string; reason: string }>(
    ({ clientId, reason }) => clientsApi.directArchive(clientId, reason),
    "Client archived",
    [queryKeys.clients.all()],
  );

/** Director only — unarchives client */
export const useUnarchiveClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, reason }: { clientId: string; reason: string }) =>
      clientsApi.unarchive(clientId, reason),

    onMutate: async ({ clientId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.clients.archived() });

      const previous = queryClient.getQueryData<Client[]>(queryKeys.clients.archived());

      queryClient.setQueryData<Client[]>(queryKeys.clients.archived(), (old = []) =>
        old.filter((c) => c._id !== clientId),
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.clients.archived(), context.previous);
      }
      toast.error("Something went wrong. Please try again.");
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all() });
      toast.success("Client unarchived");
    },
  });
};
