import { Request, Response } from "express";
import * as eventService from "../services/event.service";
import { wrapAsync } from "../utils/wrapAsync";
import { BadRequestError } from "../utils/errors";
import { eventTypeSchema } from "@seller/shared/types";

export const getEvents = wrapAsync(async (req: Request, res: Response): Promise<void> => {
  const events = await eventService.getEvents(req.userId!);
  res.status(200).json({ events });
});

export const getPendingInvitations = wrapAsync(
  async (req: Request, res: Response): Promise<void> => {
    const invitations = await eventService.getPendingInvitations(req.userId!);
    res.status(200).json({ invitations });
  },
);

export const getEventById = wrapAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const event = await eventService.getEventById(id, req.userId!);
  res.status(200).json({ event });
});

export const createEvent = wrapAsync(async (req: Request, res: Response): Promise<void> => {
  const {
    title,
    startDate,
    duration,
    allDay,
    location,
    description,
    type,
    clientId,
    mandatory,
    inviteeIds,
    regionId,
    superregionId,
  } = req.body;

  const parsed = eventTypeSchema.safeParse(type);
  if (!parsed.success) throw new BadRequestError("Invalid event type");

  const { event, conflicts } = await eventService.createEvent(
    {
      title,
      startDate,
      duration,
      allDay: allDay ?? false,
      location,
      description,
      type: parsed.data,
      clientId,
      mandatory,
      inviteeIds,
      regionId,
      superregionId,
    },
    req.userId!,
    req.userRole!,
  );

  res.status(201).json({ event, conflicts });
});

export const updateEvent = wrapAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const { title, startDate, duration, allDay, location, description, type, clientId, inviteeIds } =
    req.body;

  const { event, conflicts } = await eventService.updateEvent(
    id,
    { title, startDate, duration, allDay, location, description, type, clientId, inviteeIds },
    req.userId!,
  );
  res.status(200).json({ event, conflicts });
});

export const deleteEvent = wrapAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  await eventService.deleteEvent(id, req.userId!);
  res.status(200).json({ message: "Event deleted" });
});

export const respondToInvitation = wrapAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const { status } = req.body as { status: "accepted" | "rejected" };

  if (!status || !["accepted", "rejected"].includes(status)) {
    throw new BadRequestError("status must be 'accepted' or 'rejected'");
  }

  const invitation = await eventService.respondToInvitation(id, req.userId!, status);
  res.status(200).json({ invitation });
});

export const getAllUsersForInvite = wrapAsync(
  async (req: Request, res: Response): Promise<void> => {
    const users = await eventService.getAllUsersForInvite();
    res.status(200).json({ users });
  },
);

export const getEventInvitations = wrapAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const invitations = await eventService.getEventInvitations(id, req.userId!);
  res.status(200).json({ invitations });
});
