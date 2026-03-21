import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi } from "@/api/clients";
import { toast } from "sonner";

const useClientMutation = <TVariables>(
  mutationFn: (vars: TVariables) => Promise<unknown>,
  successMessage: string,
  invalidateKeys: string[][],
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
    [["clients"]],
  );

/** Deputy / Director — archives directly with reason */
export const useDirectArchive = () =>
  useClientMutation<{ clientId: string; reason: string }>(
    ({ clientId, reason }) => clientsApi.directArchive(clientId, reason),
    "Client archived",
    [["clients"]],
  );

/** Director only — unarchives client */
export const useUnarchiveClient = () =>
  useClientMutation<{ clientId: string; reason: string }>(
    ({ clientId, reason }) => clientsApi.unarchive(clientId, reason),
    "Client unarchived",
    [["clients"]],
  );
