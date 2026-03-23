import Event from "../models/Event";
import { IEvent } from "../types";

const populate = (q: ReturnType<typeof Event.find>) =>
  q.populate("createdBy", "firstName lastName").populate("clientId", "companyName numericId");

export const findEventsByUserId = async (userId: string): Promise<IEvent[]> => {
  const Invitation = (await import("../models/Invitation")).default;
  const accepted = await Invitation.find({
    inviteeId: userId,
    status: { $in: ["accepted", "pending"] },
  }).select("eventId");

  const invitedIds = accepted.map((i) => i.eventId);

  return populate(
    Event.find({
      $or: [{ createdBy: userId }, { _id: { $in: invitedIds } }],
    }).sort({ startDate: 1 }),
  ) as Promise<IEvent[]>;
};
/**
 * Returns all events created by user OR where user has accepted invitation.
 */

/**
 * Returns events for a user within a date range — used for conflict checking.
 */
export const findEventsByUserIdAndDateRange = async (
  userId: string,
  start: Date,
  end: Date,
): Promise<IEvent[]> => {
  const Invitation = (await import("../models/Invitation")).default;
  const accepted = await Invitation.find({ inviteeId: userId, status: "accepted" }).select(
    "eventId",
  );
  const invitedIds = accepted.map((i) => i.eventId);

  return Event.find({
    $or: [{ createdBy: userId }, { _id: { $in: invitedIds } }],
    startDate: { $gte: start, $lte: end },
  }) as Promise<IEvent[]>;
};

export const findEventById = async (eventId: string): Promise<IEvent | null> =>
  populate(Event.find({ _id: eventId }).limit(1)).then(
    (r) => r[0] ?? null,
  ) as Promise<IEvent | null>;

export const createEvent = async (data: {
  title: string;
  startDate: Date;
  duration: number | null;
  allDay: boolean;
  location: string | null;
  description: string | null;
  type: string;
  clientId: string | null;
  createdBy: string;
  mandatory: boolean;
}): Promise<IEvent> => {
  const event = new Event(data);
  return event.save() as Promise<IEvent>;
};

export const updateEventById = async (
  eventId: string,
  data: Partial<{
    title: string;
    startDate: Date;
    duration: number | null;
    allDay: boolean;
    location: string | null;
    description: string | null;
    type: string;
    clientId: string | null;
  }>,
): Promise<IEvent | null> => {
  await Event.findByIdAndUpdate(eventId, data);
  const result = await populate(Event.find({ _id: eventId }).limit(1));
  return (result[0] ?? null) as IEvent | null;
};

export const deleteEventById = async (eventId: string): Promise<boolean> => {
  const result = await Event.deleteOne({ _id: eventId });
  return result.deletedCount > 0;
};
