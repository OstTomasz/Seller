import { Request, Response, NextFunction } from "express";
import { UserRole } from "../types";

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!roles.includes(req.userRole as UserRole)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    next();
  };
};
