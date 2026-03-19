import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import { BadRequestError, UnauthorizedError } from "../utils/errors";
import { wrapAsync } from "../utils/wrapAsync";

export const login = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new BadRequestError("Email and password are required");
    }

    const { user, token } = await authService.login(email, password);
    res.status(200).json({ user, token });
  },
);

export const getMe = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const user = await authService.getMe(req.userId!);
    res.status(200).json({ user });
  },
);
export const verifyPassword = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { password } = req.body;
    if (!password) throw new BadRequestError("Password is required");

    await authService.verifyPassword(req.userId!, password);
    res.status(200).json({ verified: true });
  },
);
