export type UserRole = "director" | "deputy" | "advisor" | "salesperson";
export type UserGrade = 1 | 2 | 3 | 4;
export type ClientStatus = "active" | "reminder" | "inactive" | "archived";

export interface Position {
  _id: string;
  code: string;
  region: string | null;
  type: UserRole;
  currentHolder: string | null;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  grade: UserGrade | null;
  position: Position | null;
  isActive: boolean;
  mustChangePassword: boolean;
}

export interface Region {
  _id: string;
  name: string;
  prefix: string;
  parentRegion: string | null;
  deputy: Position | null;
}

export interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
}

export interface Address {
  _id: string;
  label: string;
  street: string;
  city: string;
  postalCode: string;
  contacts: Contact[];
}

export interface ArchiveRequest {
  requestedAt: string | null;
  requestedBy: string | null;
  reason: string | null;
}

export interface Client {
  _id: string;
  companyName: string;
  nip: string | null;
  assignedTo: Position;
  assignedAdvisor: Position | null;
  status: ClientStatus;
  lastActivityAt: string | null;
  inactivityReason: string | null;
  archiveRequest: ArchiveRequest;
  notes: string | null;
  addresses: Address[];
  contacts: Contact[];
  createdAt: string;
  updatedAt: string;
}

// API response wrappers
export interface ApiError {
  message: string;
  mustChangePassword?: boolean;
}
