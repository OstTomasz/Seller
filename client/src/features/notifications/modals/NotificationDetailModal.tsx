import { useState } from "react";
import { INotification } from "@/types";
import { Modal, Badge, Button, Textarea } from "@/components/ui";
import { useNotificationActions } from "../hooks/useNotificationActions";
import { resolveClientId, isClientNotification } from "../utils/resolveClientId";
import { notificationTypeBadges, notificationTypeLabels } from "../utils/notificationPresentation";
import { useAuthStore } from "@/store/authStore";
import { CheckCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ClientNotificationContent,
  EventNotificationContent,
} from "./NotificationDetailModal.sections";

type ActionType = "reject-archive" | "approve-unarchive" | "reject-unarchive";

// --- Main component ---

interface NotificationDetailModalProps {
  notification: INotification | null;
  onClose: () => void;
}

export const NotificationDetailModal = ({
  notification,
  onClose,
}: NotificationDetailModalProps) => {
  const { user } = useAuthStore();
  const [reasonOpen, setReasonOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const { approveArchive, rejectArchive, approveUnarchive, rejectUnarchive } =
    useNotificationActions(onClose);

  if (!notification) return null;

  const clientId = resolveClientId(notification.clientId);
  const isClientType = isClientNotification(notification.type);
  const metadata = notification.metadata;

  const canActArchive =
    notification.type === "archive_request" && user?.role === "director" && !!clientId;
  const canActUnarchive =
    notification.type === "unarchive_request" && user?.role === "director" && !!clientId;
  const canAct = canActArchive || canActUnarchive;

  const isActing =
    approveArchive.isPending ||
    rejectArchive.isPending ||
    approveUnarchive.isPending ||
    rejectUnarchive.isPending;

  const formattedDate = new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(notification.createdAt));

  const openReasonModal = (type: ActionType) => {
    setReason("");
    setReasonError("");
    setActionType(type);
    setReasonOpen(true);
  };

  const handleApprove = () => {
    if (!clientId) return;
    if (canActArchive) {
      approveArchive.mutate(clientId);
    } else {
      openReasonModal("approve-unarchive");
    }
  };

  const handleReject = () => {
    openReasonModal(canActArchive ? "reject-archive" : "reject-unarchive");
  };

  const handleReasonSubmit = () => {
    if (!reason.trim()) {
      setReasonError("Reason is required");
      return;
    }
    if (!clientId) return;
    if (actionType === "reject-archive") {
      rejectArchive.mutate({ clientId, reason: reason.trim() });
    } else if (actionType === "approve-unarchive") {
      approveUnarchive.mutate({ clientId, reason: reason.trim() });
    } else if (actionType === "reject-unarchive") {
      rejectUnarchive.mutate({ clientId, reason: reason.trim() });
    }
  };

  const reasonModalTitle =
    actionType === "approve-unarchive"
      ? "Approve unarchive request"
      : actionType === "reject-unarchive"
        ? "Reject unarchive request"
        : "Reject archive request";

  const reasonModalIsDanger = actionType !== "approve-unarchive";
  const isPendingAction =
    approveUnarchive.isPending || rejectArchive.isPending || rejectUnarchive.isPending;

  return (
    <>
      <Modal isOpen={!!notification && !reasonOpen} onClose={onClose} title="Notification details">
        <div className="flex flex-col gap-4">
          {/* Header: type badge + creation date */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Badge variant={notificationTypeBadges[notification.type]}>
              {notificationTypeLabels[notification.type]}
            </Badge>
            <span className="text-xs text-celery-600">{formattedDate}</span>
          </div>

          {isClientType ? (
            <ClientNotificationContent notification={notification} />
          ) : (
            <EventNotificationContent notification={notification} />
          )}

          {/* Actions — only for director on archive/unarchive requests */}
          {canAct && (
            <div className="flex gap-2 pt-1">
              <Button
                variant="ghost"
                className="flex-1 border border-red-800 text-red-400 hover:bg-red-950"
                onClick={handleReject}
                disabled={isActing}
              >
                <X className="h-4 w-4 mr-1.5" />
                Reject
              </Button>
              <Button className="flex-1" onClick={handleApprove} disabled={isActing}>
                <CheckCheck className="h-4 w-4 mr-1.5" />
                {approveArchive.isPending ? "Approving..." : "Approve"}
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={reasonOpen}
        onClose={() => setReasonOpen(false)}
        title={reasonModalTitle}
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-celery-400">
            {actionType === "approve-unarchive"
              ? "Provide a reason for unarchiving "
              : "Provide a reason for rejecting the request for "}
            <span className="text-celery-200 font-medium">
              {metadata?.companyName ?? "this client"}
            </span>
            .
          </p>

          <div className="flex flex-col gap-1">
            <Textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setReasonError("");
              }}
              placeholder="Enter reason..."
              rows={3}
              surface="elevated"
              hideErrorSpace
              className={cn(
                "w-full border bg-celery-900/30 px-3 py-2 text-sm text-celery-100 placeholder:text-celery-600 transition-colors",
                reasonError
                  ? "border-red-700 focus:border-red-500"
                  : "border-celery-700 focus:border-celery-500",
              )}
            />
            <p className="text-xs text-red-400 min-h-4">{reasonError}</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setReasonOpen(false)}
              disabled={isPendingAction}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "flex-1",
                reasonModalIsDanger
                  ? "border border-red-800 text-red-400 hover:bg-red-950"
                  : "border border-celery-600 text-celery-300 hover:bg-celery-800",
              )}
              onClick={handleReasonSubmit}
              disabled={isPendingAction}
            >
              {isPendingAction ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
