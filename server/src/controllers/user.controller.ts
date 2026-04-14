import { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service";
import { UserRole } from "../types";
import { BadRequestError } from "../utils/errors";
import { generateTokenForUser } from "../services/auth.service";
import { wrapAsync } from "../utils/wrapAsync";
import { created, ok } from "../utils/httpResponse";

export const getUsers = wrapAsync(
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const users = await userService.getUsers();
    ok(res, { users });
  },
);

export const getUserById = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const user = await userService.getUserById(id);
    ok(res, { user });
  },
);

export const createUser = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { firstName, lastName, email, temporaryPassword, grade, positionId, phone } = req.body;

    if (!firstName || !lastName || !email || !temporaryPassword || !positionId || !phone) {
      throw new BadRequestError(
        "firstName, lastName, email, phone, temporaryPassword and positionId are required",
      );
    }

    const user = await userService.createUser(
      { firstName, lastName, email, temporaryPassword, phone, grade, positionId },
      req.userId!,
      req.userRole as UserRole,
    );

    created(res, { user });
  },
);

export const updateUser = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const { firstName, lastName, email, positionId, phone, grade } = req.body;

    const user = await userService.updateUser(
      id,
      { firstName, lastName, email, positionId, phone, grade },
      req.userId!,
      req.userRole as UserRole,
    );

    ok(res, { user });
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
    ok(res, { user });
  },
);

export const toggleUserActive = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };

    const user = await userService.toggleUserActive(id, req.userId!, req.userRole as UserRole);

    ok(res, { user });
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

    ok(res, { message: "Password changed successfully", token });
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

    ok(res, { message: "Password reset successfully" });
  },
);
export const getSalespersons = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const users = await userService.getSalespersons(req.userId!, req.userRole as UserRole);
    ok(res, { users });
  },
);

export const getUsersForStructure = wrapAsync(
  async (_req: Request, res: Response): Promise<void> => {
    const users = await userService.getUsersForStructure();
    ok(res, { users });
  },
);

export const removeFromPosition = wrapAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const user = await userService.removeUserFromPosition(id, req.userId!, req.userRole as UserRole);
  ok(res, { user });
});

export const archiveUser = wrapAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const { reason } = req.body;
  if (!reason) throw new BadRequestError("reason is required");
  const user = await userService.archiveUser(id, reason, req.userId!, req.userRole as UserRole);
  ok(res, { user });
});

export const getArchivedUsers = wrapAsync(async (_req: Request, res: Response): Promise<void> => {
  const users = await userService.getArchivedUsers();
  ok(res, { users });
});

export const addUserNote = wrapAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const { content } = req.body;
  if (!content) throw new BadRequestError("content is required");
  const user = await userService.addUserNote(id, content, req.userId!, req.userRole as UserRole);
  ok(res, { user });
});

export const updateUserNote = wrapAsync(async (req: Request, res: Response): Promise<void> => {
  const { id, noteId } = req.params as { id: string; noteId: string };
  const { content } = req.body;
  if (!content) throw new BadRequestError("content is required");
  const user = await userService.updateUserNote(
    id,
    noteId,
    content,
    req.userId!,
    req.userRole as UserRole,
  );
  ok(res, { user });
});

export const deleteUserNote = wrapAsync(async (req: Request, res: Response): Promise<void> => {
  const { id, noteId } = req.params as { id: string; noteId: string };
  const user = await userService.deleteUserNote(id, noteId, req.userId!, req.userRole as UserRole);
  ok(res, { user });
});

export const unarchiveUser = wrapAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const user = await userService.unarchiveUser(id, req.userId!, req.userRole as UserRole);
  ok(res, { user });
});
