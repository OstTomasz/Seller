import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { INotification } from "@/types";
import { notificationsApi } from "@/api/notifications";
import { queryKeys } from "@/lib/queryKeys";

export const NOTIFICATIONS_KEY = queryKeys.notifications.all();

export const useNotifications = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: async (): Promise<INotification[]> => {
      const { data } = await notificationsApi.getAll();
      return data.notifications;
    },
    retry: false,
  });

  const markAsRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });

  const markAsUnread = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsUnread(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });

  return { ...query, markAsRead, markAsUnread, remove };
};
