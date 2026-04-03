import dayjs from "dayjs";
import type { IEvent, IInvitation } from "@seller/shared/types";
import { CalendarEvent, CalendarEventResource, EventVariant } from "@/types";

const resolveVariant = (
  event: IEvent,
  invitation: IInvitation | undefined,
  isOwn: boolean,
): EventVariant => {
  // Mandatory always wins — regardless of who created the event
  if (event.mandatory) return "mandatory";
  if (isOwn) return "own";

  if (invitation) {
    if (invitation.status === "accepted") return "invited_accepted";
    if (invitation.status === "rejected") return "invited_rejected";
    return "invited_pending";
  }

  // Region event visible via RBAC, but user is neither author nor invitee
  return "team";
};

/**
 * Transforms a single API event into RBC CalendarEvent.
 * Duration is stored in minutes; null means allDay.
 */
export const transformEvent = (
  event: IEvent,
  invitation: IInvitation | undefined,
  currentUserId: string,
): CalendarEvent => {
  const start = dayjs(event.startDate).toDate();
  const end =
    event.allDay || event.duration === null
      ? dayjs(event.startDate).endOf("day").toDate()
      : dayjs(event.startDate).add(event.duration, "minute").toDate();

  const isOwn =
    typeof event.createdBy === "string"
      ? event.createdBy === currentUserId
      : event.createdBy._id === currentUserId;

  const variant = resolveVariant(event, invitation, isOwn);

  const resource: CalendarEventResource = {
    raw: event,
    invitation,
    variant,
    canEdit: isOwn,
    canDrag: isOwn && !event.mandatory,
  };

  return { id: event._id, title: event.title, start, end, allDay: event.allDay, resource };
};

/** Batch transform with O(n) invitation lookup */
export const transformEvents = (
  events: IEvent[],
  invitations: IInvitation[],
  currentUserId: string,
): CalendarEvent[] => {
  const invitationMap = new Map(
    invitations.map((inv) => {
      const eventId = typeof inv.eventId === "string" ? inv.eventId : inv.eventId._id;
      return [eventId, inv];
    }),
  );

  return events.map((e) => transformEvent(e, invitationMap.get(e._id), currentUserId));
};
