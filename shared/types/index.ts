import { z } from "zod";

// ── Enums / primitives (Zod as source of truth) ───────────────────────────────

export const userRoleSchema = z.enum(["director", "deputy", "advisor", "salesperson"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userGradeSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
export type UserGrade = z.infer<typeof userGradeSchema>;

export const clientStatusSchema = z.enum(["active", "reminder", "inactive", "archived"]);
export type ClientStatus = z.infer<typeof clientStatusSchema>;

// ── Shared schemas & types (used by both frontend and backend) ───────────────

export const contactSchema = z.object({
  _id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
});
export type IContact = z.infer<typeof contactSchema>;

export const addressSchema = z.object({
  _id: z.string(),
  label: z.string(),
  street: z.string(),
  city: z.string(),
  postalCode: z.string(),
  contacts: z.array(contactSchema),
});
export type IAddress = z.infer<typeof addressSchema>;

export const archiveRequestSchema = z.object({
  requestedAt: z.string().nullable(),
  requestedBy: z.string().nullable(),
  reason: z.string().nullable(),
});
export type IArchiveRequest = z.infer<typeof archiveRequestSchema>;

export const noteAuthorSchema = z.object({
  _id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: userRoleSchema,
});
export type INoteAuthor = z.infer<typeof noteAuthorSchema>;

export const noteSchema = z.object({
  _id: z.string(),
  content: z.string(),
  createdBy: z.union([z.string(), noteAuthorSchema]).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type INote = z.infer<typeof noteSchema>;

export const regionBaseSchema = z.object({
  _id: z.string(),
  name: z.string(),
  prefix: z.string(),
});
export type IRegionBase = z.infer<typeof regionBaseSchema>;

export const updateRegionPrefixSchema = z.object({
  prefix: z.string().min(1).max(5).toUpperCase(),
});

export const positionBaseSchema = z.object({
  _id: z.string(),
  code: z.string(),
  type: userRoleSchema,
});
export type IPositionBase = z.infer<typeof positionBaseSchema>;

export const userBaseSchema = z.object({
  _id: z.string(),
  numericId: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  role: userRoleSchema,
  grade: userGradeSchema.nullable(),
  isActive: z.boolean(),
  mustChangePassword: z.boolean(),
  createdAt: z.string(),
});
export type IUserBase = z.infer<typeof userBaseSchema>;

export const clientBaseSchema = z.object({
  _id: z.string(),
  numericId: z.number(),
  companyName: z.string(),
  nip: z.string().nullable(),
  status: clientStatusSchema,
  lastActivityAt: z.string().nullable(),
  inactivityReason: z.string().nullable(),
  archiveRequest: archiveRequestSchema,
  notes: z.array(noteSchema),
  addresses: z.array(addressSchema),
  contacts: z.array(contactSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type IClientBase = z.infer<typeof clientBaseSchema>;

// ── API error ─────────────────────────────────────────────────────────────────

export const apiErrorSchema = z.object({
  message: z.string(),
  mustChangePassword: z.boolean().optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

// ── Token ─────────────────────────────────────────────────────────────────────

export const tokenPayloadSchema = z.object({
  userId: z.string(),
  role: z.string(),
  mustChangePassword: z.boolean(),
});
export type TokenPayload = z.infer<typeof tokenPayloadSchema>;

//── Notification ─────────────────────────────────────────────────────────────────────

export const notificationTypeSchema = z.enum([
  "archive_request",
  "archive_approved",
  "archive_rejected",
  "unarchive_request",
  "unarchive_approved",
  "unarchive_rejected",
  "client_unarchived",
  "event_invitation",
  "event_mandatory",
  "event_conflict",
  "event_response",
  "event_updated",
  "event_cancelled",
]);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const notificationClientSchema = z.object({
  _id: z.string(),
  companyName: z.string(),
  numericId: z.number(),
});
export type INotificationClient = z.infer<typeof notificationClientSchema>;

export const notificationMetadataSchema = z
  .object({
    // client notifications
    reason: z.string().nullable().optional(),
    rejectionReason: z.string().nullable().optional(),
    companyName: z.string().nullable().optional(),
    // event notifications
    eventTitle: z.string().nullable().optional(),
    conflictingEventId: z.string().nullable().optional(),
    conflictingEventTitle: z.string().nullable().optional(),
    responderName: z.string().nullable().optional(),
    responderStatus: z.enum(["accepted", "rejected"]).nullable().optional(),
  })
  .optional();
export type INotificationMetadata = z.infer<typeof notificationMetadataSchema>;

export const eventTypeSchema = z.enum(["client_meeting", "team_meeting", "personal"]);
export type EventType = z.infer<typeof eventTypeSchema>;

export const notificationSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  type: notificationTypeSchema,
  clientId: z
    .union([
      z.string(),
      z.object({
        _id: z.string(),
        companyName: z.string(),
        numericId: z.number(),
      }),
    ])
    .nullable()
    .optional(),
  eventId: z
    .union([
      z.string(),
      z.object({
        _id: z.string(),
        title: z.string(),
        startDate: z.string(),
        type: eventTypeSchema,
      }),
    ])
    .nullable()
    .optional(),
  message: z.string(),
  read: z.boolean(),
  metadata: notificationMetadataSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type INotification = z.infer<typeof notificationSchema>;

//── Event ─────────────────────────────────────────────────────────────────────

export const invitationStatusSchema = z.enum(["pending", "accepted", "rejected"]);
export type InvitationStatus = z.infer<typeof invitationStatusSchema>;

export const eventSchema = z.object({
  _id: z.string(),
  title: z.string(),
  startDate: z.string(),
  duration: z.number().nullable(),
  allDay: z.boolean(),
  location: z.string().nullable(),
  description: z.string().nullable(),
  type: eventTypeSchema,
  clientId: z.union([z.string(), notificationClientSchema]).nullable(),
  createdBy: z.union([z.string(), userBaseSchema]),
  mandatory: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type IEvent = z.infer<typeof eventSchema>;

export const invitationSchema = z.object({
  _id: z.string(),
  eventId: z.union([z.string(), eventSchema]),
  inviteeId: z.union([z.string(), userBaseSchema]),
  status: invitationStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type IInvitation = z.infer<typeof invitationSchema>;

export const regionForInviteSchema = z.object({
  _id: z.string(),
  name: z.string(),
  prefix: z.string(),
  parentRegion: z.union([
    z.object({ _id: z.string(), name: z.string(), prefix: z.string() }),
    z.string(),
    z.null(),
  ]),
});
export type IRegionForInviteSchema = z.infer<typeof regionForInviteSchema>;

export const userForInviteSchema = z.object({
  _id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  numericId: z.number(),
  isActive: z.boolean(),
  role: userRoleSchema,
  position: z
    .object({
      _id: z.string(),
      code: z.string(),
      region: regionForInviteSchema.nullable().optional(),
    })
    .nullable()
    .optional(),
});
export type UserForInvite = z.infer<typeof userForInviteSchema>;

export const inviteeSchema = z.object({
  _id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  numericId: z.number(),
});

export const invitationWithInviteeSchema = z.object({
  _id: z.string(),
  eventId: z.string(),
  inviteeId: z.union([z.string(), inviteeSchema]),
  status: invitationStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type IInvitationWithInvitee = z.infer<typeof invitationWithInviteeSchema>;

//===User Profile====

export const userProfileSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  phone: z.string().nullable(),
  description: z.string().nullable(),
  workplace: z.string().nullable(),
  avatarIndex: z.number().int().min(0).max(4),
  avatar: z.string().nullable(),
  updatedAt: z.string(),
  lastLoginAt: z.string().nullable(),
});
export type IUserProfile = z.infer<typeof userProfileSchema>;

export const userWithProfileSchema = z.object({
  user: userBaseSchema.extend({
    position: z
      .object({
        _id: z.string(),
        code: z.string(),
        type: userRoleSchema,
        region: z
          .object({
            _id: z.string(),
            name: z.string(),
            prefix: z.string(),
            parentRegion: z
              .object({ _id: z.string(), name: z.string(), prefix: z.string() })
              .nullable(),
          })
          .nullable(),
      })
      .nullable(),
  }),
  profile: userProfileSchema.nullable(),
});
export type IUserWithProfile = z.infer<typeof userWithProfileSchema>;

export const positionHistorySchema = z.object({
  _id: z.string(),
  positionId: z.string(),
  userId: z.union([
    z.string(),
    z.object({
      _id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      numericId: z.number(),
    }),
  ]),
  assignedAt: z.string(),
  removedAt: z.string().nullable(),
});
export type IPositionHistory = z.infer<typeof positionHistorySchema>;

export const userNoteSchema = z.object({
  _id: z.string(),
  content: z.string(),
  createdBy: z.union([z.string(), noteAuthorSchema]).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type IUserNote = z.infer<typeof userNoteSchema>;

export type NipCheckResult =
  | { status: "free" }
  | { status: "active"; clientId: string; companyName: string; salespersonName: string }
  | { status: "archived"; clientId: string; companyName: string };
