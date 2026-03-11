import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import { BadRequestError, UnauthorizedError } from "../utils/errors";

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      next(new BadRequestError("Email and password are required"));
      return;
    }

    const { user, token } = await authService.login(email, password);
    res.status(200).json({ user, token });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) {
      next(new UnauthorizedError());
      return;
    }

    const user = await authService.getMe(req.userId);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};
