import { AlertTriangle, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { INotification } from "@/types";

interface InfoRowProps {
  label: string;
  value: string;
  labelClassName?: string;
  valueClassName?: string;
  borderClassName?: string;
  bgClassName?: string;
}

export const InfoRow = ({
  label,
  value,
  labelClassName = "text-celery-500",
  valueClassName = "text-celery-100",
  borderClassName = "border-celery-800",
  bgClassName = "bg-celery-900/30",
}: InfoRowProps) => (
  <div className={cn("rounded-lg border px-4 py-3", borderClassName, bgClassName)}>
    <p className={cn("text-xs mb-0.5", labelClassName)}>{label}</p>
    <p className={cn("text-sm font-medium", valueClassName)}>{value}</p>
  </div>
);

interface ClientNotificationContentProps {
  notification: INotification;
}

export const ClientNotificationContent = ({ notification }: ClientNotificationContentProps) => {
  const metadata = notification.metadata;

  const reasonLabel: Partial<Record<INotification["type"], string>> = {
    archive_request: "Archive reason",
    archive_approved: "Archive reason",
    unarchive_approved: "Unarchive reason",
    client_unarchived: "Unarchive reason",
  };

  const rejectionLabel: Partial<Record<INotification["type"], string>> = {
    archive_rejected: "Rejection reason",
    unarchive_rejected: "Rejection reason",
  };

  return (
    <div className="flex flex-col gap-3">
      <InfoRow label="Client" value={metadata?.companyName ?? "—"} />
      {reasonLabel[notification.type] && metadata?.reason ? (
        <InfoRow
          label={reasonLabel[notification.type] ?? "Reason"}
          value={metadata.reason}
          labelClassName="text-amber-600"
          valueClassName="text-amber-300"
          borderClassName="border-amber-900"
          bgClassName="bg-amber-950/40"
        />
      ) : null}
      {rejectionLabel[notification.type] && metadata?.rejectionReason ? (
        <InfoRow
          label={rejectionLabel[notification.type] ?? "Rejection reason"}
          value={metadata.rejectionReason}
          labelClassName="text-red-500"
          valueClassName="text-red-300"
          borderClassName="border-red-900"
          bgClassName="bg-red-950/40"
        />
      ) : null}
    </div>
  );
};

interface EventNotificationContentProps {
  notification: INotification;
}

export const EventNotificationContent = ({ notification }: EventNotificationContentProps) => {
  const metadata = notification.metadata;
  const eventData =
    notification.eventId !== null &&
    notification.eventId !== undefined &&
    typeof notification.eventId === "object"
      ? notification.eventId
      : null;

  const eventTitle = eventData?.title ?? metadata?.eventTitle ?? "—";
  const formattedEventDate = eventData?.startDate
    ? new Intl.DateTimeFormat("pl-PL", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(eventData.startDate))
    : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-celery-800 bg-celery-900/30 px-4 py-3">
        <p className="text-xs text-celery-500 mb-0.5 flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          Event
        </p>
        <p className="text-sm font-medium text-celery-100">{eventTitle}</p>
        {formattedEventDate ? <p className="text-xs text-celery-500 mt-1">{formattedEventDate}</p> : null}
      </div>

      {notification.type === "event_response" && metadata?.responderName ? (
        <div className="rounded-lg border border-celery-800 bg-celery-900/30 px-4 py-3">
          <p className="text-xs text-celery-500 mb-0.5 flex items-center gap-1.5">
            <User className="h-3 w-3" />
            Response
          </p>
          <p className="text-sm text-celery-100">
            <span className="font-medium">{metadata.responderName}</span>{" "}
            <span className={cn(metadata.responderStatus === "accepted" ? "text-green-400" : "text-red-400")}>
              {metadata.responderStatus === "accepted" ? "accepted" : "rejected"}
            </span>{" "}
            the invitation
          </p>
        </div>
      ) : null}

      {notification.type === "event_conflict" && metadata?.conflictingEventTitle ? (
        <div className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3">
          <p className="text-xs text-red-500 mb-0.5 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" />
            Conflicts with
          </p>
          <p className="text-sm text-red-300">{metadata.conflictingEventTitle}</p>
        </div>
      ) : null}
    </div>
  );
};
