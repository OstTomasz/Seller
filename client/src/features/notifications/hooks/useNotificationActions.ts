import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi } from "@/api/clients";
import { queryKeys } from "@/lib/queryKeys";
import { NOTIFICATIONS_KEY } from "./useNotifications";

export const useNotificationActions = (onSuccess: () => void) => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    queryClient.invalidateQueries({ queryKey: queryKeys.clients.all() });
  };

  const approveArchive = useMutation({
    mutationFn: (clientId: string) => clientsApi.approveArchive(clientId),
    onSuccess: () => {
      invalidate();
      onSuccess();
    },
  });

  const rejectArchive = useMutation({
    mutationFn: ({ clientId, reason }: { clientId: string; reason: string }) =>
      clientsApi.rejectArchive(clientId, reason),
    onSuccess: () => {
      invalidate();
      onSuccess();
    },
  });

  const approveUnarchive = useMutation({
    mutationFn: ({ clientId, reason }: { clientId: string; reason: string }) =>
      clientsApi.unarchive(clientId, reason),
    onSuccess: () => {
      invalidate();
      onSuccess();
    },
  });

  const rejectUnarchive = useMutation({
    mutationFn: ({ clientId, reason }: { clientId: string; reason: string }) =>
      clientsApi.rejectUnarchive(clientId, reason),
    onSuccess: () => {
      invalidate();
      onSuccess();
    },
  });

  return { approveArchive, rejectArchive, approveUnarchive, rejectUnarchive };
};
