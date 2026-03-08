import { Document, Types } from "mongoose";

export type UserRole = "director" | "deputy" | "advisor" | "salesperson";
export type UserGrade = 1 | 2 | 3 | 4;

export interface IRegion extends Document {
  name: string;
  deputy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  grade: UserGrade | null;
  region: Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}
