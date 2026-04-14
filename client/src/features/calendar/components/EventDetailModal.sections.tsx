import dayjs from "dayjs";
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Tag,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent, EventVariant, IInvitationWithInvitee } from "@/types";
import { useEventInvitations } from "../hooks/useEventInvitations";

const statusConfig = {
  accepted: { icon: CheckCircle2, className: "text-celery-400", label: "Accepted" },
  pending: { icon: Clock, className: "text-amber-400", label: "Pending" },
  rejected: { icon: XCircle, className: "text-red-400", label: "Declined" },
} as const;

export const variantBadgeStyles: Record<EventVariant, string> = {
  own: "bg-celery-700 text-celery-100",
  invited_accepted: "bg-gold-700 text-gold-100",
  invited_pending: "bg-gold-900 text-gold-300 border border-gold-600 border-dashed",
  invited_rejected: "bg-red-900 text-red-300 border border-red-600 border-dashed",
  mandatory: "bg-red-900 text-red-200",
  team: "bg-celery-900 text-celery-400",
};

export const variantLabel: Record<EventVariant, string> = {
  own: "Your event",
  invited_accepted: "Accepted",
  invited_pending: "Pending invitation",
  invited_rejected: "Declined",
  mandatory: "Mandatory",
  team: "Team event",
};

export const typeLabel: Record<string, string> = {
  client_meeting: "Client meeting",
  team_meeting: "Team meeting",
  personal: "Personal",
};

export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xs font-semibold text-celery-500 uppercase tracking-wider mb-3">{children}</h3>
);

export const DetailRow = ({
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

const ParticipantRow = ({ invitation }: { invitation: IInvitationWithInvitee }) => {
  const invitee = typeof invitation.inviteeId === "object" ? invitation.inviteeId : null;
  if (!invitee) return null;
  const config = statusConfig[invitation.status];
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

export const ParticipantsSection = ({ eventId }: { eventId: string }) => {
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
      <div className="flex gap-2 mt-2">
        {accepted.length > 0 ? (
          <span className="text-xs text-celery-400">
            <CheckCircle2 size={10} className="inline mr-0.5" />
            {accepted.length} accepted
          </span>
        ) : null}
        {pending.length > 0 ? (
          <span className="text-xs text-amber-500">
            <Clock size={10} className="inline mr-0.5" />
            {pending.length} pending
          </span>
        ) : null}
        {rejected.length > 0 ? (
          <span className="text-xs text-red-500">
            <XCircle size={10} className="inline mr-0.5" />
            {rejected.length} declined
          </span>
        ) : null}
      </div>
    </section>
  );
};

export const EventDetailsSection = ({ event }: { event: CalendarEvent }) => {
  const { raw } = event.resource;
  const formatDateRange = () => {
    if (raw.allDay) return dayjs(raw.startDate).format("D MMMM YYYY");
    const start = dayjs(raw.startDate).format("D MMMM YYYY, HH:mm");
    const end = raw.duration !== null ? dayjs(raw.startDate).add(raw.duration, "minute").format("HH:mm") : null;
    return end ? `${start} – ${end}` : start;
  };
  const clientName = raw.clientId && typeof raw.clientId !== "string" ? raw.clientId.companyName : null;
  const createdByName =
    typeof raw.createdBy !== "string" ? `${raw.createdBy.firstName} ${raw.createdBy.lastName}` : null;

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>Details</SectionTitle>
      <DetailRow icon={Calendar} label="Date" value={formatDateRange()} />
      <DetailRow icon={MapPin} label="Location" value={raw.location} />
      <DetailRow icon={User} label="Organiser" value={createdByName} />
      <DetailRow icon={Tag} label="Client" value={clientName} />
      {raw.description ? (
        <div className="flex flex-col gap-1 mt-1">
          <span className="text-xs text-celery-500">Description</span>
          <p className="text-sm text-celery-300 leading-relaxed whitespace-pre-wrap">{raw.description}</p>
        </div>
      ) : null}
    </section>
  );
};
