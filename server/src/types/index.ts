import { Document, Types } from "mongoose";

import type {
  UserRole,
  UserGrade,
  INotification as INotificationBase,
  NotificationType,
  InvitationStatus,
  EventType,
} from "@seller/shared/types";

// re-export shared types so rest of server can import from "../types"
export type {
  UserRole,
  UserGrade,
  ClientStatus,
  INote,
  TokenPayload,
  EventType,
  InvitationStatus,
  NotificationType,
} from "@seller/shared/types";
// ── Mongoose documents ────────────────────────────────────────────────────────

export interface IRegion extends Document {
  name: string;
  prefix: string;
  parentRegion: Types.ObjectId | null;
  deputy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPosition extends Document {
  code: string;
  region: Types.ObjectId | null;
  type: UserRole;
  currentHolder: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser extends Document {
  numericId: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string | null;
  grade: UserGrade | null;
  position: Types.ObjectId | null;
  isActive: boolean;
  mustChangePassword: boolean;
  createdBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  archivedReason: string | null;
  archivedPositionCode: string | null;
  notes: IMongoNote[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IMongoContact {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
}

// re-export as IAddress so existing imports work
export type IAddress = IMongoAddress;

export interface IMongoAddress {
  _id: Types.ObjectId;
  label: string;
  street: string;
  city: string;
  postalCode: string;
  contacts: IMongoContact[];
}

export interface IMongoNote {
  _id: Types.ObjectId;
  content: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IClient extends Document {
  numericId: number;
  companyName: string;
  nip: string | null;
  assignedTo: Types.ObjectId;
  assignedAdvisor: Types.ObjectId | null;
  status: string;
  lastActivityAt: Date | null;
  inactivityReason: string | null;
  archiveRequest: {
    requestedAt: Date | null;
    requestedBy: Types.ObjectId | null;
    reason: string | null;
  };
  notes: IMongoNote[];
  addresses: IMongoAddress[];
  contacts: IMongoContact[];
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  clientId?: Types.ObjectId | null;
  eventId?: Types.ObjectId | null;
  message: string;
  read: boolean;
  metadata?: INotificationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationMetadata {
  reason?: string | null;
  rejectionReason?: string | null;
  companyName?: string | null;
  eventTitle?: string | null;
  conflictingEventId?: string | null;
  conflictingEventTitle?: string | null;
  responderName?: string | null;
  responderStatus?: "accepted" | "rejected" | null;
}

export interface IEvent extends Document {
  title: string;
  startDate: Date;
  duration: number | null;
  allDay: boolean;
  location: string | null;
  description: string | null;
  type: EventType;
  clientId: Types.ObjectId | null;
  createdBy: Types.ObjectId;
  mandatory: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInvitation extends Document {
  eventId: Types.ObjectId;
  inviteeId: Types.ObjectId;
  status: InvitationStatus;
  createdAt: Date;
  updatedAt: Date;
}

// dodaj:
export interface ICompanyFile {
  _id: Types.ObjectId;
  name: string;
  mimeType: string;
  size: number;
  data: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

export interface ICompanyNote {
  _id: Types.ObjectId;
  content: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  title: string;
}
