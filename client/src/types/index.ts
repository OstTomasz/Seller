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
} from "@seller/shared/types";

import type { IUserBase, IClientBase, UserRole, INote } from "@seller/shared/types";

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
