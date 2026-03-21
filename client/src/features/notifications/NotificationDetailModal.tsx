import { useState } from "react";
import { INotification } from "@/types";
import { Modal, Badge, Button } from "@/components/ui";
import { useNotificationActions } from "./hooks/useNotificationActions";
import { useAuthStore } from "@/store/authStore";
import { CheckCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<INotification["type"], string> = {
  archive_request: "Archive request",
  archive_approved: "Client archived",
  archive_rejected: "Archive rejected",
  unarchive_request: "Unarchive request",
  client_unarchived: "Client unarchived",
};

const TYPE_BADGE: Record<INotification["type"], "warning" | "muted" | "gold" | "active" | "error"> =
  {
    archive_request: "warning",
    archive_approved: "muted",
    archive_rejected: "error",
    unarchive_request: "gold",
    client_unarchived: "active",
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
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const clientId = notification
    ? typeof notification.clientId === "object"
      ? notification.clientId._id
      : notification.clientId
    : null;

  const { approve, reject } = useNotificationActions(onClose);

  if (!notification) return null;

  const metadata = notification.metadata;
  const canAct = notification.type === "archive_request" && user?.role === "director";
  const isActing = approve.isPending || reject.isPending;

  const formattedDate = new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(notification.createdAt));

  const handleApprove = () => {
    if (!clientId) return;
    approve.mutate(clientId);
  };

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) {
      setRejectError("Rejection reason is required");
      return;
    }
    if (!clientId) return;
    reject.mutate({ clientId, reason: rejectReason.trim() });
  };

  const handleRejectOpen = () => {
    setRejectReason("");
    setRejectError("");
    setRejectOpen(true);
  };

  return (
    <>
      <Modal isOpen={!!notification && !rejectOpen} onClose={onClose} title="Notification details">
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

            {/* Archive reason */}
            {(notification.type === "archive_request" ||
              notification.type === "archive_approved") &&
              metadata?.reason && (
                <div className="rounded-lg border border-amber-900 bg-amber-950/40 px-4 py-3">
                  <p className="text-xs text-amber-600 mb-0.5">Archive reason</p>
                  <p className="text-sm text-amber-300">{metadata.reason}</p>
                </div>
              )}

            {/* Rejection reason */}
            {notification.type === "archive_rejected" && metadata?.rejectionReason && (
              <div className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3">
                <p className="text-xs text-red-500 mb-0.5">Rejection reason</p>
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
                onClick={handleRejectOpen}
                disabled={isActing}
              >
                <X className="h-4 w-4 mr-1.5" />
                Reject
              </Button>
              <Button className="flex-1" onClick={handleApprove} disabled={isActing}>
                <CheckCheck className="h-4 w-4 mr-1.5" />
                {approve.isPending ? "Approving..." : "Approve"}
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Reject reason modal */}
      <Modal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject archive request"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-celery-400">
            Provide a reason for rejecting the archive request for{" "}
            <span className="text-celery-200 font-medium">
              {metadata?.companyName ?? "this client"}
            </span>
            .
          </p>

          <div className="flex flex-col gap-1">
            <textarea
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (e.target.value.trim()) setRejectError("");
              }}
              placeholder="Enter rejection reason..."
              rows={3}
              className={cn(
                "w-full rounded-lg border bg-celery-900/30 px-3 py-2 text-sm text-celery-100 placeholder:text-celery-600 outline-none resize-none transition-colors",
                rejectError
                  ? "border-red-700 focus:border-red-500"
                  : "border-celery-700 focus:border-celery-500",
              )}
            />
            <p className="text-xs text-red-400 min-h-4">{rejectError}</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setRejectOpen(false)}
              disabled={reject.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="flex-1 border border-red-800 text-red-400 hover:bg-red-950"
              onClick={handleRejectSubmit}
              disabled={reject.isPending}
            >
              {reject.isPending ? "Rejecting..." : "Confirm rejection"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
