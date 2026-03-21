import { INotification, NotificationType } from "@/types";
import { Badge } from "@/components/ui";
import { Trash2, CheckCheck, MailOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type BadgeVariant = "active" | "warning" | "error" | "muted" | "gold";

const TYPE_CONFIG: Record<NotificationType, { label: string; variant: BadgeVariant }> = {
  archive_request: { label: "Archive request", variant: "warning" },
  archive_approved: { label: "Archived", variant: "muted" },
  archive_rejected: { label: "Archive rejected", variant: "error" },
  unarchive_request: { label: "Unarchive request", variant: "gold" },
  client_unarchived: { label: "Unarchived", variant: "active" },
};

interface NotificationItemProps {
  notification: INotification;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
  onDetails: (notification: INotification) => void;
  isLoading: boolean;
  onMarkAsUnread: (id: string) => void;
}

export const NotificationItem = ({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onRemove,
  onDetails,
  isLoading,
}: NotificationItemProps) => {
  const config = TYPE_CONFIG[notification.type];

  const clientName =
    typeof notification.clientId === "object" ? notification.clientId.companyName : null;

  const formattedDate = new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(notification.createdAt));

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 px-4 py-3 border-b border-celery-800 last:border-0 transition-colors",
        !notification.read && "bg-celery-900/30",
      )}
    >
      {/* lewa strona — klikalny obszar otwierający modal */}
      <button
        onClick={() => onDetails(notification)}
        className="flex flex-col gap-1 min-w-0 flex-1 text-left"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={config.variant}>{config.label}</Badge>
          {!notification.read && <span className="h-2 w-2 rounded-full bg-celery-400 shrink-0" />}
        </div>
        {clientName !== null ? (
          <p className="text-sm text-celery-100 font-medium truncate">{clientName}</p>
        ) : (
          <p className="text-sm text-celery-400 truncate">{notification.message}</p>
        )}
        <span className="text-xs text-celery-600">{formattedDate}</span>
      </button>

      {/* przyciski akcji — existing code bez zmian */}
      <div className="flex items-center gap-1 shrink-0 mt-0.5">
        {!notification.read && (
          <button
            onClick={() => onMarkAsRead(notification._id)}
            disabled={isLoading}
            aria-label="Mark as read"
            className="p-1.5 rounded-md text-celery-500 hover:text-celery-300 hover:bg-celery-800 transition-colors disabled:opacity-40"
          >
            <CheckCheck className="h-4 w-4" />
          </button>
        )}
        {notification.read && (
          <button
            onClick={() => onMarkAsUnread(notification._id)}
            disabled={isLoading}
            aria-label="Mark as unread"
            className="p-1.5 rounded-md text-celery-500 hover:text-celery-300 hover:bg-celery-800 transition-colors disabled:opacity-40"
          >
            <MailOpen className="h-4 w-4" />
          </button>
        )}
        {notification.type !== "archive_request" && (
          <button
            onClick={() => onRemove(notification._id)}
            disabled={isLoading}
            aria-label="Delete notification"
            className="p-1.5 rounded-md text-celery-500 hover:text-red-400 hover:bg-red-950 transition-colors disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
