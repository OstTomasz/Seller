import { Document, Types } from "mongoose";

// re-export shared types so rest of server can import from "../types"
export type { UserRole, UserGrade, ClientStatus, INote, TokenPayload } from "@seller/shared/types";

import type { UserRole, UserGrade } from "@seller/shared/types";

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
  grade: UserGrade | null;
  position: Types.ObjectId | null;
  isActive: boolean;
  mustChangePassword: boolean;
  createdBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
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
