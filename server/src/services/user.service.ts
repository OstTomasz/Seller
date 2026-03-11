import User from "../models/User";
import Region from "../models/Region";
import { IUser, UserGrade, UserRole } from "../types";
import {
  ForbiddenError,
  NotFoundError,
  BadRequestError,
  ConflictError,
} from "../utils/errors";

// ─── helpers ──────────────────────────────────────────────────────────────────

// Checks if a region belongs to deputy's superregion
const verifyDeputyRegionAccess = async (
  deputyId: string,
  regionId: string,
): Promise<void> => {
  const region = await Region.findById(regionId);
  if (!region) throw new NotFoundError("Region not found");

  if (!region.parentRegion) throw new ForbiddenError();

  const superregion = await Region.findById(region.parentRegion);
  if (!superregion || superregion.deputy?.toString() !== deputyId) {
    throw new ForbiddenError();
  }
};

// Checks if deputy has access to a specific user
const verifyDeputyUserAccess = async (
  deputyId: string,
  targetUser: IUser,
): Promise<void> => {
  if (!targetUser.region) throw new ForbiddenError();
  await verifyDeputyRegionAccess(deputyId, targetUser.region.toString());
};

// ─── service functions ────────────────────────────────────────────────────────

export const getUsers = async (): Promise<IUser[]> => {
  return await User.find()
    .populate("region")
    .select("-password")
    .sort({ lastName: 1, firstName: 1 });
};

export const getUserById = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId)
    .populate("region")
    .select("-password");
  if (!user) throw new NotFoundError("User not found");
  return user;
};

export const createUser = async (
  data: {
    firstName: string;
    lastName: string;
    email: string;
    temporaryPassword: string;
    role: UserRole;
    grade?: UserGrade | null;
    region?: string | null;
  },
  requesterId: string,
  requesterRole: UserRole,
): Promise<IUser> => {
  // deputy can only create users in their own regions
  if (requesterRole === "deputy") {
    if (!data.region) throw new ForbiddenError();
    await verifyDeputyRegionAccess(requesterId, data.region);

    // deputy cannot create director or deputy
    if (data.role === "director" || data.role === "deputy") {
      throw new ForbiddenError();
    }
  }

  const existingUser = await User.findOne({ email: data.email });
  if (existingUser)
    throw new ConflictError("User with this email already exists");

  const user = await User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: data.temporaryPassword,
    role: data.role,
    grade: data.grade ?? null,
    region: data.region ?? null,
    mustChangePassword: true, // always true for new users
    createdBy: requesterId,
  });

  return user;
};

export const updateUser = async (
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    region?: string | null;
  },
  requesterId: string,
  requesterRole: UserRole,
): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found");

  if (requesterRole === "deputy") {
    await verifyDeputyUserAccess(requesterId, user);

    // deputy cannot change region to outside their superregion
    if (data.region !== undefined && data.region !== null) {
      await verifyDeputyRegionAccess(requesterId, data.region);
    }
  }

  const updated = await User.findByIdAndUpdate(
    userId,
    { ...data },
    { new: true, runValidators: true },
  )
    .populate("region")
    .select("-password");

  return updated!;
};

export const updateUserRoleAndGrade = async (
  userId: string,
  role: UserRole,
  grade: UserGrade | null,
): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found");

  // grade required for advisor and salesperson
  if ((role === "advisor" || role === "salesperson") && !grade) {
    throw new BadRequestError("Grade is required for advisor and salesperson");
  }

  // grade must be null for director and deputy
  if (role === "director" || role === "deputy") {
    grade = null;
  }

  const updated = await User.findByIdAndUpdate(
    userId,
    { role, grade },
    { new: true, runValidators: true },
  )
    .populate("region")
    .select("-password");

  return updated!;
};

export const toggleUserActive = async (
  userId: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found");

  // cannot deactivate yourself
  if (userId === requesterId)
    throw new BadRequestError("Cannot deactivate yourself");

  if (requesterRole === "deputy") {
    await verifyDeputyUserAccess(requesterId, user);
  }

  const updated = await User.findByIdAndUpdate(
    userId,
    { isActive: !user.isActive },
    { new: true },
  )
    .populate("region")
    .select("-password");

  return updated!;
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found");

  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) throw new BadRequestError("Current password is incorrect");

  user.password = newPassword;
  user.mustChangePassword = false;
  await user.save();
};

export const resetPassword = async (
  userId: string,
  temporaryPassword: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found");

  if (requesterRole === "deputy") {
    await verifyDeputyUserAccess(requesterId, user);
  }

  user.password = temporaryPassword;
  user.mustChangePassword = true;
  await user.save();
};
