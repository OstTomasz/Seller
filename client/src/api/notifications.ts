import { api } from "@/lib/axios";
import { INotification } from "@/types";

export const notificationsApi = {
  getAll: () => api.get<{ notifications: INotification[] }>("/notifications"),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  remove: (id: string) => api.delete(`/notifications/${id}`),
  markAsUnread: (id: string) => api.patch(`/notifications/${id}/unread`),
};
