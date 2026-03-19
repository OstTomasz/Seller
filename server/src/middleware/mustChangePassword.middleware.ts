import { Request, Response, NextFunction } from "express";

export const requirePasswordChange = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.path.endsWith("/me/password") && req.method === "PATCH") {
    next();
    return;
  }

  if (req.mustChangePassword) {
    res.status(403).json({
      message: "Password change required",
      mustChangePassword: true,
    });
    return;
  }

  next();
};
