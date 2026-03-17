// ── Enums / primitives ────────────────────────────────────────────────────────

export type UserRole = "director" | "deputy" | "advisor" | "salesperson";
export type UserGrade = 1 | 2 | 3 | 4;
export type ClientStatus = "active" | "reminder" | "inactive" | "archived";

// ── Shared interfaces (used by both frontend and backend) ─────────────────────

export interface IContact {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
}

export interface IAddress {
  _id: string;
  label: string;
  street: string;
  city: string;
  postalCode: string;
  contacts: IContact[];
}

export interface IArchiveRequest {
  requestedAt: string | null;
  requestedBy: string | null;
  reason: string | null;
}

export interface INote {
  _id: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IRegionBase {
  _id: string;
  name: string;
  prefix: string;
}

export interface IPositionBase {
  _id: string;
  code: string;
  type: UserRole;
}

export interface IUserBase {
  _id: string;
  numericId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  grade: UserGrade | null;
  isActive: boolean;
  mustChangePassword: boolean;
}

export interface IClientBase {
  _id: string;
  numericId: number;
  companyName: string;
  nip: string | null;
  status: ClientStatus;
  lastActivityAt: string | null;
  inactivityReason: string | null;
  archiveRequest: IArchiveRequest;
  notes: INote[];
  addresses: IAddress[];
  contacts: IContact[];
  createdAt: string;
  updatedAt: string;
}

// ── API error ─────────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  mustChangePassword?: boolean;
}

// ── Token ─────────────────────────────────────────────────────────────────────

export interface TokenPayload {
  userId: string;
  role: string;
  mustChangePassword: boolean;
}
