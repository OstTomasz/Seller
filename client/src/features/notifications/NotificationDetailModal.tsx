// client/src/features/notifications/NotificationDetailModal.tsx

import { useState } from "react";
import { INotification } from "@/types";
import { Modal, Badge, Button } from "@/components/ui";
import { useNotificationActions } from "./hooks/useNotificationActions";
import { useAuthStore } from "@/store/authStore";
import { CheckCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ActionType = "reject-archive" | "approve-unarchive" | "reject-unarchive";

const TYPE_LABELS: Record<INotification["type"], string> = {
  archive_request: "Archive request",
  archive_approved: "Client archived",
  archive_rejected: "Archive rejected",
  unarchive_request: "Unarchive request",
  unarchive_approved: "Client unarchived",
  unarchive_rejected: "Unarchive rejected",
  client_unarchived: "Client unarchived",
};

const TYPE_BADGE: Record<INotification["type"], "warning" | "muted" | "gold" | "active" | "error"> =
  {
    archive_request: "warning",
    archive_approved: "muted",
    archive_rejected: "error",
    unarchive_request: "gold",
    unarchive_approved: "active",
    unarchive_rejected: "error",
    client_unarchived: "active",
  };

const REASON_LABEL: Partial<Record<INotification["type"], string>> = {
  archive_request: "Archive reason",
  archive_approved: "Archive reason",
  unarchive_approved: "Unarchive reason",
  client_unarchived: "Unarchive reason",
};

const REJECTION_LABEL: Partial<Record<INotification["type"], string>> = {
  archive_rejected: "Rejection reason",
  unarchive_rejected: "Rejection reason",
};

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

  const clientId = notification
    ? typeof notification.clientId === "object"
      ? notification.clientId._id
      : notification.clientId
    : null;

  const { approveArchive, rejectArchive, approveUnarchive, rejectUnarchive } =
    useNotificationActions(onClose);

  if (!notification) return null;

  const metadata = notification.metadata;
  const canActArchive = notification.type === "archive_request" && user?.role === "director";
  const canActUnarchive = notification.type === "unarchive_request" && user?.role === "director";
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
          {/* Type + date */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Badge variant={TYPE_BADGE[notification.type]}>{TYPE_LABELS[notification.type]}</Badge>
            <span className="text-xs text-celery-600">{formattedDate}</span>
          </div>

          <div className="flex flex-col gap-3">
            {/* Client name */}
            <div className="rounded-lg border border-celery-800 bg-celery-900/30 px-4 py-3">
              <p className="text-xs text-celery-500 mb-0.5">Client</p>
              <p className="text-sm font-medium text-celery-100">{metadata?.companyName ?? "—"}</p>
            </div>

            {/* Reason (archive/unarchive) */}
            {REASON_LABEL[notification.type] && metadata?.reason && (
              <div className="rounded-lg border border-amber-900 bg-amber-950/40 px-4 py-3">
                <p className="text-xs text-amber-600 mb-0.5">{REASON_LABEL[notification.type]}</p>
                <p className="text-sm text-amber-300">{metadata.reason}</p>
              </div>
            )}

            {/* Rejection reason */}
            {REJECTION_LABEL[notification.type] && metadata?.rejectionReason && (
              <div className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3">
                <p className="text-xs text-red-500 mb-0.5">{REJECTION_LABEL[notification.type]}</p>
                <p className="text-sm text-red-300">{metadata.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Approve / Reject actions */}
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

      {/* Reason modal — reject archive / approve unarchive / reject unarchive */}
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
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setReasonError("");
              }}
              placeholder="Enter reason..."
              rows={3}
              className={cn(
                "w-full rounded-lg border bg-celery-900/30 px-3 py-2 text-sm text-celery-100 placeholder:text-celery-600 outline-none resize-none transition-colors",
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
