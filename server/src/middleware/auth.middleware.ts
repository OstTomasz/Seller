import { env } from "../config/env";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { TokenPayload } from "../types";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      mustChangePassword?: boolean;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.mustChangePassword = decoded.mustChangePassword;

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
