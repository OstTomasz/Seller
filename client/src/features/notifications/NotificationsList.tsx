import { useEffect, useState } from "react";
import { INotification } from "@/types";
import { NotificationDetailModal } from "./NotificationDetailModal";
import { useNotifications } from "./hooks/useNotifications";

import { Loader, FetchError } from "@/components/ui";
import { Bell, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationItem } from "./NotificationItem";

interface NotificationListProps {
  defaultExpanded?: boolean;
}

export const NotificationList = ({ defaultExpanded = false }: NotificationListProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [detailNotification, setDetailNotification] = useState<INotification | null>(null);
  const {
    data: notifications = [],
    isLoading,
    isError,
    markAsRead,
    markAsUnread,
    remove,
  } = useNotifications();

  useEffect(() => {
    if (defaultExpanded) setIsExpanded(true);
  }, [defaultExpanded]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleDetails = (notification: INotification) => {
    setDetailNotification(notification);
    if (!notification.read) markAsRead.mutate(notification._id); // auto mark as read on open
  };

  return (
    <>
      <div className="max-w-6xl mx-auto w-full rounded-lg border border-celery-600 bg-bg-surface">
        {/* Header  */}
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-celery-900/40",
            isExpanded ? "rounded-t-lg" : "rounded-lg",
          )}
        >
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-celery-500" />
            <span className="text-sm font-medium text-celery-200">Notifications</span>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-celery-500 text-celery-950 text-xs font-semibold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-celery-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-celery-500" />
          )}
        </button>

        {/* Rozwijana zawartość */}
        {isExpanded && (
          <div className="border-t border-celery-800">
            {isLoading ? (
              <div className="py-6">
                <Loader label="notifications" />
              </div>
            ) : isError ? (
              <div className="py-4">
                <FetchError label="notifications" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-celery-500 text-center py-8">No notifications</p>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={(id) => markAsRead.mutate(id)}
                  onMarkAsUnread={(id) => markAsUnread.mutate(id)} // ← dodaj
                  onRemove={(id) => remove.mutate(id)}
                  onDetails={handleDetails}
                  isLoading={markAsRead.isPending || remove.isPending || markAsUnread.isPending}
                />
              ))
            )}
          </div>
        )}
      </div>
      <NotificationDetailModal
        notification={detailNotification}
        onClose={() => setDetailNotification(null)}
      />
    </>
  );
};
