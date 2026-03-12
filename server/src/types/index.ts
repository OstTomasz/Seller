import { Document, Types } from "mongoose";

export type UserRole = "director" | "deputy" | "advisor" | "salesperson";
export type UserGrade = 1 | 2 | 3 | 4;
export type ClientStatus = "active" | "reminder" | "inactive" | "archived";

//Region
export interface IRegion extends Document {
  name: string;
  prefix: string;
  parentRegion: Types.ObjectId | null;
  deputy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

//Position

export interface IPosition extends Document {
  code: string;
  region: Types.ObjectId | null;
  type: UserRole;
  currentHolder: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

//User

export interface IUser extends Document {
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

//Client

export interface IContact {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
}

export interface IAddress {
  _id: Types.ObjectId;
  label: string;
  street: string;
  city: string;
  postalCode: string;
  contacts: IContact[];
}

export interface IArchiveRequest {
  requestedAt: Date | null;
  requestedBy: Types.ObjectId | null;
  reason: string | null;
}

export interface IClient extends Document {
  companyName: string;
  nip: string | null;
  assignedTo: Types.ObjectId;
  assignedAdvisor: Types.ObjectId | null;
  status: ClientStatus;
  lastActivityAt: Date | null;
  inactivityReason: string | null;
  archiveRequest: IArchiveRequest;
  notes: string | null;
  addresses: IAddress[];
  contacts: IContact[];
  createdAt: Date;
  updatedAt: Date;
}

//Helpers

export interface TokenPayload {
  userId: string;
  role: string;
}
