import { env } from "../config/env";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { TokenPayload, UserRole } from "../types";
import { userRoleSchema } from "@seller/shared/types";

// declare global {
//   namespace Express {
//     interface Request {
//       userId?: string;
//       userRole?: UserRole;
//       mustChangePassword?: boolean;
//     }
//   }
// }

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

    const roleResult = userRoleSchema.safeParse(decoded.role);
    if (!roleResult.success) {
      res.status(401).json({ message: "Invalid token role" });
      return;
    }

    req.userId = decoded.userId;
    req.userRole = roleResult.data;
    req.mustChangePassword = decoded.mustChangePassword;

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
