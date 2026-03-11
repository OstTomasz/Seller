import { Request, Response, NextFunction } from "express";
import User from "../models/User";

export const requirePasswordChange = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // skip for password change endpoint itself — infinite loop otherwise
  if (req.path === "/me/password" && req.method === "PATCH") {
    next();
    return;
  }

  const user = await User.findById(req.userId);

  if (user?.mustChangePassword) {
    res.status(403).json({
      message: "Password change required",
      mustChangePassword: true,
    });
    return;
  }

  next();
};
