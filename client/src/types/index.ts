export type {
  UserRole,
  UserGrade,
  ClientStatus,
  IContact,
  IAddress,
  IArchiveRequest,
  INote,
  IUserBase,
  IClientBase,
  ApiError,
  TokenPayload,
  INoteAuthor,
  INotification,
  INotificationClient,
  NotificationType,
  IRegionForInviteSchema,
  UserForInvite,
  IInvitationWithInvitee,
} from "@seller/shared/types";

import {
  type IUserBase,
  type IClientBase,
  type UserRole,
  type INote,
  type IEvent,
  type IInvitation,
  eventTypeSchema,
} from "@seller/shared/types";
import { stringOrDate } from "react-big-calendar";
import z from "zod";

// ── Frontend-specific types (with populated relations) ────────────────────────

export interface Position {
  _id: string;
  code: string;
  region: {
    _id: string;
    name: string;
    parentRegion: { _id: string; name: string } | null;
  } | null;
  type: UserRole;
  currentHolder: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface Region {
  _id: string;
  name: string;
  prefix: string;
  parentRegion: string | null;
  deputy: Position | null;
}

export interface User extends IUserBase {
  position: Position | null;
}

export interface Client extends Omit<IClientBase, "notes"> {
  assignedTo: Position;
  assignedAdvisor: Position | null;
  notes: INote[];
}

// ── Calendar types ────────────────────────────────────────────────────────────

export type EventVariant = "own" | "invited_pending" | "invited_accepted" | "mandatory" | "team";

export type CalendarView = "month" | "week" | "agenda";

export interface CalendarEventResource {
  raw: IEvent;
  invitation?: IInvitation;
  /** Visual variant for color-coding */
  variant: EventVariant;
  /** Whether current user is the author (can edit) */
  canEdit: boolean;
  /** Whether current user can drag & drop this event */
  canDrag: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: CalendarEventResource;
}

/** Typed args for DnD drop/resize handlers */
export interface DragDropEventArgs {
  event: CalendarEvent;
  start: stringOrDate;
  end: stringOrDate;
  allDay?: boolean;
}

export const eventFormSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    type: eventTypeSchema,
    allDay: z.boolean(),
    startDate: z.string().min(1, "Date is required"),
    startTime: z.string().optional(),
    duration: z.number().min(1).optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    inviteeIds: z.array(z.string()).optional(),
    mandatory: z.boolean().optional(),
    clientId: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "team_meeting" && (data.inviteeIds?.length ?? 0) < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Team meeting requires at least one participant",
        path: ["inviteeIds"],
      });
    }
  });

export type EventFormValues = z.infer<typeof eventFormSchema>;

/** Builds ISO startDate string from form values */
export const buildStartDate = (values: EventFormValues): string =>
  values.allDay
    ? new Date(`${values.startDate}T00:00:00`).toISOString()
    : new Date(`${values.startDate}T${values.startTime}`).toISOString();

/** Builds duration in minutes from form values */
export const buildDuration = (values: EventFormValues): number | null =>
  values.allDay ? null : values.duration !== undefined ? Number(values.duration) : null;

export interface UserForInviteRegion {
  _id: string;
  name: string;
  prefix: string;
  parentRegion: string | null;
}
