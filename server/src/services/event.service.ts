import {
  IEvent,
  IInvitation,
  EventType,
  InvitationStatus,
  UserRole,
  NotificationType,
} from "../types";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/errors";
import * as eventRepository from "../repositories/event.repository";
import * as invitationRepository from "../repositories/invitation.repository";
import * as notificationRepository from "../repositories/notification.repository";
import * as userRepository from "../repositories/user.repository";
import * as clientRepository from "../repositories/client.repository";

import {
  getSubordinateUserIdsForDeputy,
  getSubordinateUserIdsForDirector,
  getUserIdsByRegionId,
  getUserIdsBySuperregionId,
} from "../utils/rbac";

/** Checks overlap between two events. */
const eventsOverlap = (
  aStart: Date,
  aDuration: number | null,
  aAllDay: boolean,
  bStart: Date,
  bDuration: number | null,
  bAllDay: boolean,
): boolean => {
  if (aAllDay || bAllDay) return aStart.toDateString() === bStart.toDateString();
  const aEnd = new Date(aStart.getTime() + (aDuration ?? 60) * 60_000);
  const bEnd = new Date(bStart.getTime() + (bDuration ?? 60) * 60_000);
  return aStart < bEnd && bStart < aEnd;
};

/** Returns conflicting events for a user on a given date range. */
const getConflicts = async (
  userId: string,
  startDate: Date,
  duration: number | null,
  allDay: boolean,
  excludeEventId?: string,
): Promise<IEvent[]> => {
  const dayStart = new Date(startDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(startDate);
  dayEnd.setHours(23, 59, 59, 999);

  const events = await eventRepository.findEventsByUserIdAndDateRange(userId, dayStart, dayEnd);
  return events.filter((e) => {
    if (excludeEventId && e._id.toString() === excludeEventId) return false;
    return eventsOverlap(startDate, duration, allDay, e.startDate, e.duration, e.allDay);
  });
};

const getCreatorId = (createdBy: unknown): string => {
  if (typeof createdBy === "string") return createdBy;
  if (createdBy && typeof createdBy === "object" && "_id" in createdBy) {
    return (createdBy as { _id: { toString(): string } })._id.toString();
  }
  return String(createdBy);
};

export const getEvents = async (userId: string): Promise<IEvent[]> =>
  eventRepository.findEventsByUserId(userId);

export const getPendingInvitations = async (userId: string): Promise<IInvitation[]> =>
  invitationRepository.findPendingInvitationsByUserId(userId);

export const getEventById = async (eventId: string, userId: string): Promise<IEvent> => {
  const event = await eventRepository.findEventById(eventId);
  if (!event) throw new NotFoundError("Event not found");

  const isOwner = getCreatorId(event.createdBy) === userId;
  const invitation = await invitationRepository.findInvitationByEventAndUser(eventId, userId);
  if (!isOwner && !invitation) throw new ForbiddenError();

  return event;
};

export const createEvent = async (
  data: {
    title: string;
    startDate: string;
    duration?: number | null;
    allDay: boolean;
    location?: string | null;
    description?: string | null;
    type: EventType;
    clientId?: string | null;
    mandatory?: boolean;
    inviteeIds?: string[];
    regionId?: string;
    superregionId?: string;
  },
  creatorId: string,
  creatorRole: UserRole,
): Promise<{ event: IEvent; conflicts: IEvent[] }> => {
  if (!data.title?.trim()) throw new BadRequestError("Title is required");
  if (!data.startDate) throw new BadRequestError("Start date is required");
  if (!data.allDay && (!data.duration || data.duration < 1)) {
    throw new BadRequestError("Duration is required for non all-day events");
  }

  const startDate = new Date(data.startDate);
  const mandatory = data.mandatory ?? false;

  if (mandatory && creatorRole !== "director" && creatorRole !== "deputy") {
    throw new ForbiddenError();
  }
  if (mandatory && data.type === "personal") {
    throw new BadRequestError("Personal events cannot be mandatory");
  }

  // resolve invitee IDs
  let resolvedInviteeIds: string[] = [...(data.inviteeIds ?? [])];

  if (mandatory) {
    if (data.superregionId) {
      const ids = await getUserIdsBySuperregionId(data.superregionId);
      resolvedInviteeIds = [...new Set([...resolvedInviteeIds, ...ids])];
    } else if (data.regionId) {
      const ids = await getUserIdsByRegionId(data.regionId);
      resolvedInviteeIds = [...new Set([...resolvedInviteeIds, ...ids])];
    } else if (resolvedInviteeIds.length === 0) {
      const ids =
        creatorRole === "director"
          ? await getSubordinateUserIdsForDirector()
          : await getSubordinateUserIdsForDeputy(creatorId);
      resolvedInviteeIds = ids;
    }
  }

  // remove creator from invitees
  resolvedInviteeIds = resolvedInviteeIds.filter((id) => id !== creatorId);

  // check conflicts for creator only
  const conflicts = await getConflicts(creatorId, startDate, data.duration ?? null, data.allDay);

  const event = await eventRepository.createEvent({
    title: data.title.trim(),
    startDate,
    duration: data.allDay ? null : (data.duration ?? null),
    allDay: data.allDay,
    location: data.location ?? null,
    description: data.description ?? null,
    type: data.type,
    clientId: data.clientId ?? null,
    createdBy: creatorId,
    mandatory,
  });

  const eventId = event._id.toString();

  if (data.clientId && data.type === "client_meeting") {
    await addMeetingNoteToClient(data.clientId, event, resolvedInviteeIds, creatorId);
  }

  if (resolvedInviteeIds.length > 0) {
    const invitationStatus: InvitationStatus = mandatory ? "accepted" : "pending";

    await invitationRepository.createInvitations(
      resolvedInviteeIds.map((inviteeId) => ({ eventId, inviteeId, status: invitationStatus })),
    );

    const notifType = (mandatory ? "event_mandatory" : "event_invitation") as NotificationType;

    await notificationRepository.createNotifications(
      resolvedInviteeIds.map((userId) => ({
        userId,
        type: notifType,
        clientId: null,
        eventId: eventId,
        message: mandatory
          ? `Mandatory event added to your calendar: ${data.title}`
          : `You have been invited to: ${data.title}`,
        metadata: { eventTitle: data.title },
      })),
    );

    // check conflicts for each invitee in mandatory events
    if (mandatory) {
      for (const inviteeId of resolvedInviteeIds) {
        const inviteeConflicts = await getConflicts(
          inviteeId,
          startDate,
          data.duration ?? null,
          data.allDay,
          eventId,
        );
        if (inviteeConflicts.length > 0) {
          if (conflicts.length > 0) {
            await notificationRepository.createNotification({
              userId: creatorId,
              type: "event_conflict" as NotificationType,
              eventId: event._id.toString(),
              message: `Your new event "${event.title}" conflicts with: ${conflicts[0].title}`,
              metadata: {
                eventTitle: event.title,
                conflictingEventId: conflicts[0]._id.toString(),
                conflictingEventTitle: conflicts[0].title,
              },
            });
          }
        }
      }
    }
  }

  if (data.clientId && data.type === "client_meeting") {
    await addMeetingNoteToClient(data.clientId, event, resolvedInviteeIds, creatorId);
  }

  return { event, conflicts };
};

export const updateEvent = async (
  eventId: string,
  data: {
    title?: string;
    startDate?: string;
    duration?: number | null;
    allDay?: boolean;
    location?: string | null;
    description?: string | null;
    type?: EventType;
    clientId?: string | null;
    inviteeIds?: string[];
  },
  userId: string,
): Promise<{ event: IEvent; conflicts: IEvent[] }> => {
  const event = await eventRepository.findEventById(eventId);
  if (!event) throw new NotFoundError("Event not found");
  if (getCreatorId(event.createdBy) !== userId) throw new ForbiddenError();

  const startDate = data.startDate ? new Date(data.startDate) : event.startDate;
  const allDay = data.allDay ?? event.allDay;
  const duration = allDay ? null : (data.duration ?? event.duration);

  const conflicts = await getConflicts(userId, startDate, duration, allDay, eventId);

  const updated = await eventRepository.updateEventById(eventId, {
    ...data,
    startDate,
    duration,
    allDay,
  });
  if (!updated) throw new NotFoundError("Event not found");
  if (data.inviteeIds && data.inviteeIds.length > 0) {
    const existing = await invitationRepository.findInvitationsByEventId(eventId);

    const existingMap = new Map(
      existing.map((inv) => {
        const invitee = inv.inviteeId as unknown as { _id: { toString(): string } } | string;
        const id =
          typeof invitee === "object" && invitee !== null
            ? invitee._id.toString()
            : String(invitee);
        return [id, inv];
      }),
    );

    const newInviteeSet = new Set(data.inviteeIds ?? []);

    const existingInviteeIds = existing
      .map((inv) => {
        const raw = inv.inviteeId as unknown as { _id: { toString(): string } } | string;
        return typeof raw === "object" && raw !== null ? raw._id.toString() : String(raw);
      })
      .filter((id) => id !== userId && !newInviteeSet.has(id));

    if (conflicts.length > 0) {
      await notificationRepository.createNotification({
        userId,
        type: "event_conflict" as NotificationType,
        eventId: updated._id.toString(),
        message: `Your event "${updated.title}" conflicts with: ${conflicts[0].title}`,
        metadata: {
          eventTitle: updated.title,
          conflictingEventId: conflicts[0]._id.toString(),
          conflictingEventTitle: conflicts[0].title,
        },
      });
    }

    const newInviteeIds: string[] = [];
    const resetInviteeIds: string[] = [];

    for (const id of data.inviteeIds) {
      if (id === userId) continue;
      const existingInv = existingMap.get(id);

      if (!existingInv) {
        newInviteeIds.push(id); // zupełnie nowy
      } else if (existingInv.status === "rejected") {
        resetInviteeIds.push(id); //
      }
      // accepted/pending — pomijamy
    }

    if (newInviteeIds.length > 0) {
      await invitationRepository.createInvitations(
        newInviteeIds.map((inviteeId) => ({ eventId, inviteeId, status: "pending" })),
      );
    }

    if (resetInviteeIds.length > 0) {
      await invitationRepository.resetRejectedInvitations(eventId, resetInviteeIds);
    }

    const notifyIds = [...newInviteeIds, ...resetInviteeIds];
    if (notifyIds.length > 0) {
      await notificationRepository.createNotifications(
        notifyIds.map((recipientId) => ({
          userId: recipientId,
          type: "event_invitation" as NotificationType,
          clientId: null,
          eventId,
          message: `You have been invited to: ${updated.title}`,
          metadata: { eventTitle: updated.title },
        })),
      );
    }
    console.log("inviteeIds from payload:", data.inviteeIds);
    console.log("existingMap keys:", [...existingMap.keys()]);
    console.log("resetInviteeIds:", resetInviteeIds);
    console.log("newInviteeIds:", newInviteeIds);
  }

  return { event: updated, conflicts };
};

export const deleteEvent = async (eventId: string, userId: string): Promise<void> => {
  const event = await eventRepository.findEventById(eventId);
  if (!event) throw new NotFoundError("Event not found");
  if (getCreatorId(event.createdBy) !== userId) throw new ForbiddenError();

  await invitationRepository.deleteInvitationsByEventId(eventId);
  const deleted = await eventRepository.deleteEventById(eventId);
  if (!deleted) throw new NotFoundError("Event not found");
};

export const respondToInvitation = async (
  eventId: string,
  userId: string,
  status: "accepted" | "rejected",
): Promise<IInvitation> => {
  const event = await eventRepository.findEventById(eventId);
  if (!event) throw new NotFoundError("Event not found");
  if (event.mandatory) throw new ForbiddenError();

  const invitation = await invitationRepository.findInvitationByEventAndUser(eventId, userId);
  if (!invitation) throw new NotFoundError("Invitation not found");
  if (invitation.status === status)
    throw new BadRequestError("Already responded with the same status");

  const updated = await invitationRepository.updateInvitationStatus(eventId, userId, status);
  if (!updated) throw new NotFoundError("Invitation not found");

  // notify event creator about response
  const responder = await userRepository.findUserById(userId);
  const responderName = responder ? `${responder.firstName} ${responder.lastName}` : "Someone";

  await notificationRepository.createNotification({
    userId: getCreatorId(event.createdBy),
    type: "event_response" as NotificationType,
    clientId: null,
    eventId: eventId,
    message: `${responderName} ${status === "accepted" ? "accepted" : "rejected"} your invitation to: ${event.title}`,
    metadata: {
      eventTitle: event.title,
      responderName,
      responderStatus: status,
    },
  });

  return updated;
};

export const getAllUsersForInvite = async () => userRepository.findAllUsersForInvite();

/**
 * Returns all invitations for an event — only owner or invitee can view.
 */
export const getEventInvitations = async (
  eventId: string,
  userId: string,
): Promise<IInvitation[]> => {
  const event = await eventRepository.findEventById(eventId);
  if (!event) throw new NotFoundError("Event not found");

  const isOwner = getCreatorId(event.createdBy) === userId;
  const invitation = await invitationRepository.findInvitationByEventAndUser(eventId, userId);
  if (!isOwner && !invitation) throw new ForbiddenError();

  return invitationRepository.findInvitationsByEventId(eventId);
};

/**
 * Adds a meeting note to the client's notes array.
 */
const addMeetingNoteToClient = async (
  clientId: string,
  event: IEvent,
  inviteeIds: string[],
  creatorId: string,
): Promise<void> => {
  const client = await clientRepository.findClientById(clientId);
  if (!client) return;

  const start = new Date(event.startDate);
  const dateStr = new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(start);
  const timeStr = event.allDay
    ? "All day"
    : new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" }).format(start);

  const lines: string[] = [
    `📅 Client meeting: ${event.title}`,
    `Date: ${dateStr}`,
    `Time: ${timeStr}`,
  ];

  if (event.duration && !event.allDay) {
    lines.push(`Duration: ${event.duration} min`);
  }
  if (event.location) {
    lines.push(`Location: ${event.location}`);
  }
  if (event.description) {
    lines.push(`Notes: ${event.description}`);
  }
  if (inviteeIds.length > 0) {
    const users = await userRepository.findUsersByIds(inviteeIds);
    const names = users.map((u) => `${u.firstName} ${u.lastName}`).join(", ");
    lines.push(`Participants: ${names}`);
  }

  const content = lines.join("\n");

  await clientRepository.updateClientById(client._id.toString(), {
    $push: { notes: { content, createdBy: creatorId } },
    lastActivityAt: new Date(),
  });
};
