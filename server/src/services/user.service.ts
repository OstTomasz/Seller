import { IUser, UserGrade, UserRole } from "../types";
import { ForbiddenError, NotFoundError, BadRequestError, ConflictError } from "../utils/errors";
import * as userRepository from "../repositories/user.repository";
import * as positionRepository from "../repositories/position.repository";
import * as regionRepository from "../repositories/region.repository";
import * as positionHistoryRepository from "../repositories/positionHistory.repository";
import { getPositionIdsInSuperregion } from "../utils/rbac";

// ─── helpers ──────────────────────────────────────────────────────────────────

// Gets region ID from a position
const getRegionFromPosition = async (positionId: string): Promise<string | null> => {
  const position = await positionRepository.findPositionById(positionId);
  return position?.region?.toString() ?? null;
};

// Gets deputy's user ID from a superregion
const getDeputyUserId = async (regionId: string): Promise<string | null> => {
  const region = await regionRepository.findRegionById(regionId);
  if (!region?.deputy) return null;
  const position = await positionRepository.findPositionById(region.deputy.toString());
  return position?.currentHolder?.toString() ?? null;
};

// Checks if a region belongs to deputy's superregion
const verifyDeputyRegionAccess = async (deputyUserId: string, regionId: string): Promise<void> => {
  const region = await regionRepository.findRegionById(regionId);
  if (!region) throw new NotFoundError("Region not found");

  // must be a subregion
  if (!region.parentRegion) throw new ForbiddenError();

  const holderId = await getDeputyUserId(region.parentRegion.toString());
  if (holderId !== deputyUserId) throw new ForbiddenError();
};

// Checks if deputy has access to a specific user
const verifyDeputyUserAccess = async (deputyUserId: string, targetUser: IUser): Promise<void> => {
  if (!targetUser.position) throw new ForbiddenError();

  const regionId = await getRegionFromPosition(targetUser.position.toString());
  if (!regionId) throw new ForbiddenError();

  await verifyDeputyRegionAccess(deputyUserId, regionId);
};

// ─── service functions ────────────────────────────────────────────────────────

export const getUsers = async (): Promise<IUser[]> => {
  return userRepository.findAllUsers();
};

export const getUserById = async (userId: string): Promise<IUser> => {
  const user = await userRepository.findUserById(userId);
  if (!user) throw new NotFoundError("User not found");
  return user;
};

export const createUser = async (
  data: {
    firstName: string;
    lastName: string;
    email: string;
    temporaryPassword: string;
    phone: string;
    grade?: UserGrade | null;
    positionId: string;
  },
  requesterId: string,
  requesterRole: UserRole,
): Promise<IUser> => {
  // 1. Email validation
  if (!data.email.endsWith("@seller.com"))
    throw new BadRequestError("Email must end with @seller.com");

  const existingUser = await userRepository.findUserByEmail(data.email);
  if (existingUser) throw new ConflictError("User with this email already exists");

  // 2. RBAC — deputy cannot create director/deputy, only in own superregion
  if (requesterRole === "deputy") {
    const pos = await positionRepository.findPositionById(data.positionId);
    if (pos?.type === "director" || pos?.type === "deputy") throw new ForbiddenError();
    const regionId = await getRegionFromPosition(data.positionId);
    if (!regionId) throw new ForbiddenError();
    await verifyDeputyRegionAccess(requesterId, regionId);
  }

  // 3. Position validation
  const position = await positionRepository.findPositionById(data.positionId);
  if (!position) throw new NotFoundError("Position not found");
  if (position.currentHolder) throw new BadRequestError("Position is already occupied");

  // 4. Role derived from position type
  const role = position.type as UserRole;
  const grade = role === "director" || role === "deputy" ? null : (data.grade ?? null);

  const user = await userRepository.createUser({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: data.temporaryPassword,
    phone: data.phone,
    role,
    grade,
    position: data.positionId,
    createdBy: requesterId,
  });

  await positionRepository.updatePositionCurrentHolder(data.positionId, user._id.toString());
  await positionHistoryRepository.createHistoryEntry(data.positionId, user._id.toString());

  return user;
};

export const updateUser = async (
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    positionId?: string | null;
    phone?: string | null;
    grade?: number | null;
  },
  requesterId: string,
  requesterRole: UserRole,
): Promise<IUser> => {
  const user = await userRepository.findRawUserById(userId);
  if (!user) throw new NotFoundError("User not found");

  if (requesterRole === "deputy") {
    // Only verify access for users WHO ALREADY HAVE a position
    // For users without position — verify target position belongs to deputy's superregion
    if (user.position) {
      await verifyDeputyUserAccess(requesterId, user);
    }

    if (data.positionId) {
      const regionId = await getRegionFromPosition(data.positionId);
      if (!regionId) throw new ForbiddenError();
      await verifyDeputyRegionAccess(requesterId, regionId);
    }
  }

  // if changing position — update old and new position
  if (data.positionId !== undefined) {
    if (user.position) {
      await positionRepository.clearPositionCurrentHolder(user.position.toString());
      await positionHistoryRepository.closeHistoryEntry(user.position.toString(), userId);
    }
    if (data.positionId) {
      const newPosition = await positionRepository.findPositionById(data.positionId);
      if (!newPosition) throw new NotFoundError("Position not found");
      if (newPosition.currentHolder) {
        throw new BadRequestError("Position is already occupied");
      }
      await positionRepository.updatePositionCurrentHolder(data.positionId, userId);
      await positionHistoryRepository.createHistoryEntry(data.positionId, userId);
    }
  }

  const updateFields: Record<string, unknown> = {};
  if (data.firstName !== undefined) updateFields.firstName = data.firstName;
  if (data.lastName !== undefined) updateFields.lastName = data.lastName;
  if (data.email !== undefined) updateFields.email = data.email;
  if (data.positionId !== undefined) updateFields.position = data.positionId;
  if (data.phone !== undefined) updateFields.phone = data.phone;
  if (data.grade !== undefined) updateFields.grade = data.grade;

  if (data.positionId) {
    const newPosition = await positionRepository.findPositionById(data.positionId);
    if (newPosition && newPosition.type !== user.role) {
      updateFields.role = newPosition.type;
      if (newPosition.type === "director" || newPosition.type === "deputy") {
        updateFields.grade = null;
      }
    }
  }
  const updated = await userRepository.updateUserById(userId, updateFields);
  return updated!;
};

export const updateUserRoleAndGrade = async (
  userId: string,
  role: UserRole,
  grade: UserGrade | null,
): Promise<IUser> => {
  const user = await userRepository.findRawUserById(userId);
  if (!user) throw new NotFoundError("User not found");

  if ((role === "advisor" || role === "salesperson") && !grade) {
    throw new BadRequestError("Grade is required for advisor and salesperson");
  }

  if (role === "director" || role === "deputy") {
    grade = null;
  }

  const updated = await userRepository.updateUserRoleAndGradeById(userId, role, grade);
  return updated!;
};

export const toggleUserActive = async (
  userId: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IUser> => {
  const user = await userRepository.findRawUserById(userId);
  if (!user) throw new NotFoundError("User not found");

  if (userId === requesterId) throw new BadRequestError("Cannot deactivate yourself");

  if (requesterRole === "deputy") {
    await verifyDeputyUserAccess(requesterId, user);
  }

  const updated = await userRepository.toggleUserActiveById(userId, !user.isActive);
  return updated!;
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<IUser> => {
  const user = await userRepository.findRawUserById(userId);
  if (!user) throw new NotFoundError("User not found");

  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) throw new BadRequestError("Current password is incorrect");

  // prevent reusing the same password
  const isSamePassword = await user.comparePassword(newPassword);
  if (isSamePassword)
    throw new BadRequestError("New password must be different from current password");

  user.password = newPassword;
  user.mustChangePassword = false;
  await user.save();

  return user;
};

export const resetPassword = async (
  userId: string,
  temporaryPassword: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<void> => {
  const user = await userRepository.findRawUserById(userId);
  if (!user) throw new NotFoundError("User not found");

  if (requesterRole === "deputy") {
    await verifyDeputyUserAccess(requesterId, user);
  }

  user.password = temporaryPassword;
  user.mustChangePassword = true;
  await user.save();
};

export const getSalespersons = async (
  requesterId: string,
  requesterRole: UserRole,
): Promise<IUser[]> => {
  if (requesterRole === "director") {
    return userRepository.findSalespersonUsers();
  }

  if (requesterRole === "deputy") {
    const positionIds = await getPositionIdsInSuperregion(requesterId);
    const all = await userRepository.findSalespersonUsers();
    return all.filter((u) => {
      const posId = (u.position as unknown as { _id: { toString(): string } })?._id?.toString();
      return posId ? positionIds.includes(posId) : false;
    });
  }

  if (requesterRole === "advisor") {
    const advisorUser = await userRepository.findRawUserById(requesterId);
    if (!advisorUser?.position) return [];

    const regionId = await getRegionFromPosition(advisorUser.position.toString());
    if (!regionId) return [];

    const all = await userRepository.findSalespersonUsers();
    return all.filter((u) => {
      const pos = u.position as unknown as { region?: { _id: { toString(): string } } } | null;
      return pos?.region?._id?.toString() === regionId;
    });
  }

  return [];
};

export const getUsersForStructure = async () => userRepository.findAllUsersForInvite();

export const removeUserFromPosition = async (
  userId: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IUser> => {
  const user = await userRepository.findRawUserById(userId);
  if (!user) throw new NotFoundError("User not found");
  if (!user.position) throw new BadRequestError("User has no position");

  if (requesterRole === "deputy") {
    await verifyDeputyUserAccess(requesterId, user);
  }

  await positionRepository.clearPositionCurrentHolder(user.position.toString());
  await positionHistoryRepository.closeHistoryEntry(user.position.toString(), userId);
  const updated = await userRepository.updateUserById(userId, { position: null });
  return updated!;
};

export const archiveUser = async (
  userId: string,
  reason: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IUser> => {
  const user = await userRepository.findRawUserById(userId);
  if (!user) throw new NotFoundError("User not found");
  if (userId === requesterId) throw new BadRequestError("Cannot archive yourself");
  if (!user.isActive) throw new BadRequestError("User is already archived");

  if (requesterRole === "deputy") {
    if (user.position) await verifyDeputyUserAccess(requesterId, user);
  }

  const positionCode = null as string | null;
  let resolvedCode: string | null = positionCode;

  if (user.position) {
    const pos = await positionRepository.findPositionById(user.position.toString());
    resolvedCode = pos?.code ?? null;
    await positionRepository.clearPositionCurrentHolder(user.position.toString());
    await positionHistoryRepository.closeHistoryEntry(user.position.toString(), userId);
  }

  const updated = await userRepository.updateUserById(userId, {
    isActive: false,
    position: null,
    archivedAt: new Date(),
    archivedReason: reason,
    archivedPositionCode: resolvedCode,
  });

  return updated!;
};

export const getArchivedUsers = async () => userRepository.findArchivedUsers();

export const addUserNote = async (
  targetUserId: string,
  content: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IUser> => {
  if (requesterRole !== "director" && requesterRole !== "deputy") throw new ForbiddenError();

  const user = await userRepository.findRawUserById(targetUserId);
  if (!user) throw new NotFoundError("User not found");

  if (requesterRole === "deputy") {
    if (user.position) await verifyDeputyUserAccess(requesterId, user);
  }

  const updated = await userRepository.addNoteToUser(targetUserId, content, requesterId);
  return updated!;
};

export const updateUserNote = async (
  targetUserId: string,
  noteId: string,
  content: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IUser> => {
  if (requesterRole !== "director" && requesterRole !== "deputy") throw new ForbiddenError();

  const user = await userRepository.findUserById(targetUserId);
  if (!user) throw new NotFoundError("User not found");

  const note = (
    user as unknown as {
      notes: { _id: { toString(): string }; createdBy: { toString(): string } }[];
    }
  ).notes.find((n) => n._id.toString() === noteId);
  if (!note) throw new NotFoundError("Note not found");

  // Deputy can only edit own notes
  if (requesterRole === "deputy" && note.createdBy.toString() !== requesterId) {
    throw new ForbiddenError();
  }

  const updated = await userRepository.updateUserNote(targetUserId, noteId, content);
  return updated!;
};

export const deleteUserNote = async (
  targetUserId: string,
  noteId: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IUser> => {
  if (requesterRole !== "director" && requesterRole !== "deputy") throw new ForbiddenError();

  const user = await userRepository.findUserById(targetUserId);
  if (!user) throw new NotFoundError("User not found");

  const note = (
    user as unknown as {
      notes: { _id: { toString(): string }; createdBy: { toString(): string } }[];
    }
  ).notes.find((n) => n._id.toString() === noteId);
  if (!note) throw new NotFoundError("Note not found");

  // Deputy can only delete own notes, director can delete all
  if (requesterRole === "deputy" && note.createdBy.toString() !== requesterId) {
    throw new ForbiddenError();
  }

  const updated = await userRepository.deleteUserNote(targetUserId, noteId);
  return updated!;
};
