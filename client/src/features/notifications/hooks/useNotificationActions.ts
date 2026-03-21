// client/src/features/notifications/hooks/useNotificationActions.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi } from "@/api/clients";
import { NOTIFICATIONS_KEY } from "./useNotifications";

/** Mutations for approve/reject archive from notification modal. */
export const useNotificationActions = (onSuccess: () => void) => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    queryClient.invalidateQueries({ queryKey: ["clients"] });
  };

  const approve = useMutation({
    mutationFn: (clientId: string) => clientsApi.approveArchive(clientId),
    onSuccess: () => {
      invalidate();
      onSuccess();
    },
  });

  const reject = useMutation({
    mutationFn: ({ clientId, reason }: { clientId: string; reason: string }) =>
      clientsApi.rejectArchive(clientId, reason),
    onSuccess: () => {
      invalidate();
      onSuccess();
    },
  });

  return { approve, reject };
};
