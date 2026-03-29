import { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service";
import { UserRole } from "../types";
import { BadRequestError } from "../utils/errors";
import { generateTokenForUser } from "../services/auth.service";
import { wrapAsync } from "../utils/wrapAsync";

export const getUsers = wrapAsync(
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const users = await userService.getUsers();
    res.status(200).json({ users });
  },
);

export const getUserById = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const user = await userService.getUserById(id);
    res.status(200).json({ user });
  },
);

export const createUser = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { firstName, lastName, email, temporaryPassword, role, grade, positionId } = req.body;

    if (!firstName || !lastName || !email || !temporaryPassword || !role) {
      throw new BadRequestError(
        "firstName, lastName, email, temporaryPassword and role are required",
      );
    }

    const user = await userService.createUser(
      {
        firstName,
        lastName,
        email,
        temporaryPassword,
        role,
        grade,
        positionId,
      },
      req.userId!,
      req.userRole as UserRole,
    );

    res.status(201).json({ user });
  },
);

export const updateUser = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const { firstName, lastName, email, positionId } = req.body;

    const user = await userService.updateUser(
      id,
      { firstName, lastName, email, positionId },
      req.userId!,
      req.userRole as UserRole,
    );

    res.status(200).json({ user });
  },
);

export const updateUserRoleAndGrade = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const { role, grade } = req.body;

    if (!role) {
      throw new BadRequestError("role is required");
    }

    const user = await userService.updateUserRoleAndGrade(id, role, grade ?? null);
    res.status(200).json({ user });
  },
);

export const toggleUserActive = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };

    const user = await userService.toggleUserActive(id, req.userId!, req.userRole as UserRole);

    res.status(200).json({ user });
  },
);

export const changePassword = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new BadRequestError("currentPassword and newPassword are required");
    }

    if (newPassword.length < 8) {
      throw new BadRequestError("New password must be at least 8 characters");
    }

    const user = await userService.changePassword(req.userId!, currentPassword, newPassword);

    const token = generateTokenForUser(user);

    res.status(200).json({ message: "Password changed successfully", token });
  },
);

export const resetPassword = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const { temporaryPassword } = req.body;

    if (!temporaryPassword) {
      throw new BadRequestError("temporaryPassword is required");
    }

    await userService.resetPassword(id, temporaryPassword, req.userId!, req.userRole as UserRole);

    res.status(200).json({ message: "Password reset successfully" });
  },
);
export const getSalespersons = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const users = await userService.getSalespersons(req.userId!, req.userRole as UserRole);
    res.status(200).json({ users });
  },
);

export const getUsersForStructure = wrapAsync(
  async (_req: Request, res: Response): Promise<void> => {
    const users = await userService.getUsersForStructure();
    res.status(200).json({ users });
  },
);
