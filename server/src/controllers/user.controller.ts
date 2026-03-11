import { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service";
import { UserRole } from "../types";
import { BadRequestError } from "../utils/errors";

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const users = await userService.getUsers();
    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const user = await userService.getUserById(id);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      firstName,
      lastName,
      email,
      temporaryPassword,
      role,
      grade,
      region,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !temporaryPassword ||
      !role ||
      !grade ||
      !region
    ) {
      next(
        new BadRequestError(
          "firstName, lastName, email, temporaryPassword, role, grade and region are required",
        ),
      );
      return;
    }

    const user = await userService.createUser(
      { firstName, lastName, email, temporaryPassword, role, grade, region },
      req.userId!,
      req.userRole as UserRole,
    );

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { firstName, lastName, email, region } = req.body;

    const user = await userService.updateUser(
      id,
      { firstName, lastName, email, region },
      req.userId!,
      req.userRole as UserRole,
    );

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const updateUserRoleAndGrade = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { role, grade } = req.body;

    if (!role) {
      next(new BadRequestError("role is required"));
      return;
    }

    const user = await userService.updateUserRoleAndGrade(
      id,
      role,
      grade ?? null,
    );
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const toggleUserActive = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const user = await userService.toggleUserActive(
      id,
      req.userId!,
      req.userRole as UserRole,
    );

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      next(new BadRequestError("currentPassword and newPassword are required"));
      return;
    }

    if (newPassword.length < 8) {
      next(new BadRequestError("New password must be at least 8 characters"));
      return;
    }

    await userService.changePassword(req.userId!, currentPassword, newPassword);
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { temporaryPassword } = req.body;

    if (!temporaryPassword) {
      next(new BadRequestError("temporaryPassword is required"));
      return;
    }

    await userService.resetPassword(
      id,
      temporaryPassword,
      req.userId!,
      req.userRole as UserRole,
    );

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};
