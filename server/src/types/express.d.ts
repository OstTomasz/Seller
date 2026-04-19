import "express";
import type { UserRole } from "@seller/shared/types";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: UserRole;
      mustChangePassword?: boolean;
    }
  }
}

export {};
