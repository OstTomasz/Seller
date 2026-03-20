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
  role: userRoleSchema,
  grade: userGradeSchema.nullable(),
  isActive: z.boolean(),
  mustChangePassword: z.boolean(),
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
