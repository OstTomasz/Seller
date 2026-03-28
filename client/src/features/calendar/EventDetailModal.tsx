import dayjs from "dayjs";
import {
  Calendar,
  MapPin,
  User,
  Tag,
  AlertTriangle,
  Trash2,
  Copy,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
} from "lucide-react";
import { Modal, Button, ConfirmDialog } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { CalendarEvent, EventVariant, IInvitationWithInvitee } from "@/types";
import { useRespondToInvitation } from "./hooks/useRespondToInvitation";
import { useDeleteEvent } from "./hooks/useDeleteEvent";
import { useConfirm } from "@/hooks/useConfirm";
import { isPastEvent } from "./utils/calendarUtils";
import { useEventInvitations } from "./hooks/useEventInvitations";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  accepted: {
    icon: CheckCircle2,
    className: "text-celery-400",
    label: "Accepted",
  },
  pending: {
    icon: Clock,
    className: "text-amber-400",
    label: "Pending",
  },
  rejected: {
    icon: XCircle,
    className: "text-red-400",
    label: "Declined",
  },
} as const;
// ── Helpers ───────────────────────────────────────────────────────────────────

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xs font-semibold text-celery-500 uppercase tracking-wider mb-3">
    {children}
  </h3>
);

const DetailRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon size={14} className="mt-0.5 shrink-0 text-celery-500" />
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-celery-500">{label}</span>
        <span className="text-sm text-celery-200">{value}</span>
      </div>
    </div>
  );
};

const variantBadgeStyles: Record<EventVariant, string> = {
  own: "bg-celery-700 text-celery-100",
  invited_accepted: "bg-gold-700 text-gold-100",
  invited_pending: "bg-gold-900 text-gold-300 border border-gold-600 border-dashed",
  mandatory: "bg-red-900 text-red-200",
  team: "bg-celery-900 text-celery-400",
};

const variantLabel: Record<EventVariant, string> = {
  own: "Your event",
  invited_accepted: "Accepted",
  invited_pending: "Pending invitation",
  mandatory: "Mandatory",
  team: "Team event",
};

const typeLabel: Record<string, string> = {
  client_meeting: "Client meeting",
  team_meeting: "Team meeting",
  personal: "Personal",
};

const ParticipantRow = ({ invitation }: { invitation: IInvitationWithInvitee }) => {
  const invitee = typeof invitation.inviteeId === "object" ? invitation.inviteeId : null;

  if (!invitee) return null;

  const config = STATUS_CONFIG[invitation.status];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <span className="text-sm text-celery-200">
          {invitee.firstName} {invitee.lastName}
        </span>
        <span className="text-xs text-celery-600">#{invitee.numericId}</span>
      </div>
      <div className={cn("flex items-center gap-1 text-xs", config.className)}>
        <Icon size={12} />
        {config.label}
      </div>
    </div>
  );
};

const ParticipantsSection = ({ eventId }: { eventId: string }) => {
  const { data: invitations = [], isLoading } = useEventInvitations(eventId);

  if (isLoading) {
    return (
      <section>
        <SectionTitle>Participants</SectionTitle>
        <p className="text-xs text-celery-600">Loading...</p>
      </section>
    );
  }

  if (invitations.length === 0) return null;

  const accepted = invitations.filter((i) => i.status === "accepted");
  const pending = invitations.filter((i) => i.status === "pending");
  const rejected = invitations.filter((i) => i.status === "rejected");

  return (
    <section>
      <SectionTitle>
        <span className="flex items-center gap-1.5">
          <Users size={12} />
          Participants ({invitations.length})
        </span>
      </SectionTitle>

      <div className="rounded-lg border border-celery-800 bg-celery-900/20 px-4 divide-y divide-celery-800/50">
        {/* Accepted first */}
        {accepted.map((inv) => (
          <ParticipantRow key={inv._id} invitation={inv} />
        ))}
        {pending.map((inv) => (
          <ParticipantRow key={inv._id} invitation={inv} />
        ))}
        {rejected.map((inv) => (
          <ParticipantRow key={inv._id} invitation={inv} />
        ))}
      </div>

      {/* Summary pills */}
      <div className="flex gap-2 mt-2">
        {accepted.length > 0 && (
          <span className="text-xs text-celery-400">
            <CheckCircle2 size={10} className="inline mr-0.5" />
            {accepted.length} accepted
          </span>
        )}
        {pending.length > 0 && (
          <span className="text-xs text-amber-500">
            <Clock size={10} className="inline mr-0.5" />
            {pending.length} pending
          </span>
        )}
        {rejected.length > 0 && (
          <span className="text-xs text-red-500">
            <XCircle size={10} className="inline mr-0.5" />
            {rejected.length} declined
          </span>
        )}
      </div>
    </section>
  );
};

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
  const isPending = isResponding || isDeleting;
  const isPast = isPastEvent(raw.startDate);

  const handleRespond = (status: "accepted" | "rejected") => {
    respond({ eventId: raw._id, status });
  };
  const formatDateRange = () => {
    if (raw.allDay) {
      return dayjs(raw.startDate).format("D MMMM YYYY");
    }
    const start = dayjs(raw.startDate).format("D MMMM YYYY, HH:mm");
    const end =
      raw.duration !== null
        ? dayjs(raw.startDate).add(raw.duration, "minute").format("HH:mm")
        : null;
    return end ? `${start} – ${end}` : start;
  };

  const clientName =
    raw.clientId && typeof raw.clientId !== "string" ? raw.clientId.companyName : null;

  const createdByName =
    typeof raw.createdBy !== "string"
      ? `${raw.createdBy.firstName} ${raw.createdBy.lastName}`
      : null;

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
          <section className="flex flex-col gap-3">
            <SectionTitle>Details</SectionTitle>
            <DetailRow icon={Calendar} label="Date" value={formatDateRange()} />
            <DetailRow icon={MapPin} label="Location" value={raw.location} />
            <DetailRow icon={User} label="Organiser" value={createdByName} />
            <DetailRow icon={Tag} label="Client" value={clientName} />
            {raw.description ? (
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-xs text-celery-500">Description</span>
                <p className="text-sm text-celery-300 leading-relaxed whitespace-pre-wrap">
                  {raw.description}
                </p>
              </div>
            ) : null}
          </section>

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
              {isPendingInvitation && !isPast ? (
                <>
                  <Button variant="ghost" onClick={onClose} disabled={isPending}>
                    Later
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => handleRespond("rejected")}
                    disabled={isPending}
                  >
                    Decline
                  </Button>
                  <Button onClick={() => handleRespond("accepted")} disabled={isPending}>
                    {isResponding ? "Saving..." : "Accept"}
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
