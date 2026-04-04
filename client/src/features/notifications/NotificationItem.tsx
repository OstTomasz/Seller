import { useNavigate } from "react-router-dom";
import { INotification, NotificationType } from "@/types";
import { Badge } from "@/components/ui";
import { Trash2, CheckCheck, MailOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type BadgeVariant = "active" | "warning" | "error" | "muted" | "gold";

const EVENT_TYPES: NotificationType[] = [
  "event_invitation",
  "event_mandatory",
  "event_conflict",
  "event_response",
];

const TYPE_CONFIG: Record<NotificationType, { label: string; variant: BadgeVariant }> = {
  archive_request: { label: "Archive request", variant: "warning" },
  archive_approved: { label: "Archived", variant: "muted" },
  archive_rejected: { label: "Archive rejected", variant: "error" },
  unarchive_request: { label: "Unarchive request", variant: "gold" },
  unarchive_approved: { label: "Unarchived", variant: "active" },
  unarchive_rejected: { label: "Unarchive rejected", variant: "error" },
  client_unarchived: { label: "Unarchived", variant: "active" },
  event_invitation: { label: "Event invitation", variant: "warning" },
  event_mandatory: { label: "Mandatory event invitation", variant: "warning" },
  event_conflict: { label: "Event conflict", variant: "error" },
  event_response: { label: "Event response", variant: "gold" },
  event_updated: { label: "Event updated", variant: "warning" },
  event_cancelled: { label: "Event cancelled", variant: "error" },
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

  const isEventNotification = EVENT_TYPES.includes(notification.type);

  const clientName =
    !isEventNotification &&
    notification.clientId !== null &&
    notification.clientId !== undefined &&
    typeof notification.clientId === "object"
      ? notification.clientId.companyName
      : null;

  const navigate = useNavigate();
  const clientId =
    !isEventNotification &&
    notification.clientId !== null &&
    typeof notification.clientId === "object"
      ? notification.clientId._id
      : null;

  const displayText = isEventNotification
    ? (notification.metadata?.eventTitle ?? notification.message)
    : (clientName ?? notification.message);

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
        <p
          className={cn(
            "text-sm truncate",
            isEventNotification || clientName ? "text-celery-100 font-medium" : "text-celery-400",
          )}
        >
          {displayText}
        </p>
        <span className="text-xs text-celery-600">{formattedDate}</span>
      </button>

      {clientId ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/clients/${clientId}`);
          }}
          className="text-xs text-celery-500 hover:text-celery-300 underline underline-offset-2 transition-colors text-left"
        >
          {clientName}
        </button>
      ) : null}

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
        {notification.type !== "archive_request" && notification.type !== "unarchive_request" && (
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
