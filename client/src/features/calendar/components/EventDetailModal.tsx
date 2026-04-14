import {
  AlertTriangle,
  Trash2,
  Copy,
} from "lucide-react";
import { Modal, Button, ConfirmDialog } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types";
import { useRespondToInvitation } from "../hooks/useRespondToInvitation";
import { useDeleteEvent } from "../hooks/useDeleteEvent";
import { useConfirm } from "@/hooks/useConfirm";
import { isPastEvent } from "../utils/calendarUtils";
import {
  EventDetailsSection,
  ParticipantsSection,
  typeLabel,
  variantBadgeStyles,
  variantLabel,
} from "./EventDetailModal.sections";

// ── Props ─────────────────────────────────────────────────────────────────────

interface EventDetailModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onEdit?: (event: CalendarEvent) => void;
  onCopy?: (event: CalendarEvent) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const EventDetailModal = ({ event, onClose, onEdit, onCopy }: EventDetailModalProps) => {
  const { mutate: respond, isPending: isResponding } = useRespondToInvitation(onClose);
  const { mutate: remove, isPending: isDeleting } = useDeleteEvent(onClose);

  const deleteConfirm = useConfirm<string>((eventId) => remove(eventId));

  if (!event) return null;

  const { raw, variant, canEdit } = event.resource;
  const isPendingInvitation = variant === "invited_pending";
  const isInvited = (variant === "invited_pending" ||
    variant === "invited_accepted" ||
    variant === "invited_rejected") satisfies boolean;
  const currentInvitationStatus = event.resource.invitation?.status ?? null;
  const isPending = isResponding || isDeleting;
  const isPast = isPastEvent(raw.startDate);

  const handleRespond = (status: "accepted" | "rejected") => {
    respond({ eventId: raw._id, status });
  };
  return (
    <>
      <Modal isOpen={event !== null} onClose={onClose} title={raw.title} size="md">
        <div className="flex flex-col gap-5">
          {/* ── Variant badge ──────────────────────────────────────────── */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                variantBadgeStyles[variant],
              )}
            >
              {variant === "mandatory" ? <AlertTriangle size={11} /> : null}
              {variantLabel[variant]}
            </span>
            <span className="text-xs text-celery-600">{typeLabel[raw.type] ?? raw.type}</span>
          </div>

          {/* ── Details ────────────────────────────────────────────────── */}
          <EventDetailsSection event={event} />

          {/* ── Participants ───────────────────────────────────────────────── */}
          <ParticipantsSection eventId={raw._id} />

          {/* ── Actions ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-2 border-t border-celery-700">
            {/* Delete — tylko autor, tylko po lewej */}
            <div>
              {canEdit && !isPast ? (
                <Button
                  variant="ghost"
                  className="text-red-400 hover:text-red-300"
                  onClick={() => deleteConfirm.ask(raw._id)}
                  disabled={isPending}
                >
                  <Trash2 size={14} className="mr-1.5" />
                  Delete
                </Button>
              ) : null}
            </div>

            <div className="flex gap-3">
              {isInvited && !isPast ? (
                <>
                  <Button variant="ghost" onClick={onClose} disabled={isPending}>
                    {isPendingInvitation ? "Later" : "Close"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => handleRespond("rejected")}
                    disabled={isPending || currentInvitationStatus === "rejected"}
                  >
                    {currentInvitationStatus === "rejected" ? "Declined" : "Decline"}
                  </Button>
                  <Button
                    onClick={() => handleRespond("accepted")}
                    disabled={isPending || currentInvitationStatus === "accepted"}
                  >
                    {isResponding
                      ? "Saving..."
                      : currentInvitationStatus === "accepted"
                        ? "Accepted"
                        : "Accept"}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={onClose} disabled={isPending}>
                    Close
                  </Button>
                  {canEdit && onEdit && !isPast ? (
                    <Button onClick={() => onEdit(event)} disabled={isPending}>
                      Edit
                    </Button>
                  ) : null}
                  {onCopy ? (
                    <Button variant="ghost" onClick={() => onCopy(event)} disabled={isPending}>
                      <Copy size={14} className="mr-1.5" />
                      Copy
                    </Button>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={deleteConfirm.cancel}
        onConfirm={deleteConfirm.confirm}
        title="Delete event?"
        description="This action cannot be undone."
        confirmLabel="Delete"
      />
    </>
  );
};
