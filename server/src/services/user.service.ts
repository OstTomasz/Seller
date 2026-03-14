import User from "../models/User";
import Position from "../models/Position";
import Region from "../models/Region";
import { IUser, UserGrade, UserRole } from "../types";
import {
  ForbiddenError,
  NotFoundError,
  BadRequestError,
  ConflictError,
} from "../utils/errors";

// ─── helpers ──────────────────────────────────────────────────────────────────

// Gets region ID from a position
const getRegionFromPosition = async (
  positionId: string,
): Promise<string | null> => {
  const position = await Position.findById(positionId);
  return position?.region?.toString() ?? null;
};

// Gets deputy's user ID from a superregion
const getDeputyUserId = async (regionId: string): Promise<string | null> => {
  const region = await Region.findById(regionId);
  if (!region?.deputy) return null;
  const position = await Position.findById(region.deputy);
  return position?.currentHolder?.toString() ?? null;
};

// Checks if a region belongs to deputy's superregion
const verifyDeputyRegionAccess = async (
  deputyUserId: string,
  regionId: string,
): Promise<void> => {
  const region = await Region.findById(regionId);
  if (!region) throw new NotFoundError("Region not found");

  // must be a subregion
  if (!region.parentRegion) throw new ForbiddenError();

  const holderId = await getDeputyUserId(region.parentRegion.toString());
  if (holderId !== deputyUserId) throw new ForbiddenError();
};

// Checks if deputy has access to a specific user
const verifyDeputyUserAccess = async (
  deputyUserId: string,
  targetUser: IUser,
): Promise<void> => {
  if (!targetUser.position) throw new ForbiddenError();

  const regionId = await getRegionFromPosition(targetUser.position.toString());
  if (!regionId) throw new ForbiddenError();

  await verifyDeputyRegionAccess(deputyUserId, regionId);
};

// ─── service functions ────────────────────────────────────────────────────────

export const getUsers = async (): Promise<IUser[]> => {
  return await User.find()
    .populate("position")
    .select("-password")
    .sort({ lastName: 1, firstName: 1 });
};

export const getUserById = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId)
    .populate("position")
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
    positionId?: string | null;
  },
  requesterId: string,
  requesterRole: UserRole,
): Promise<IUser> => {
  if (requesterRole === "deputy") {
    if (data.role === "director" || data.role === "deputy") {
      throw new ForbiddenError();
    }

    if (!data.positionId) throw new ForbiddenError();

    // verify position belongs to deputy's superregion
    const regionId = await getRegionFromPosition(data.positionId);
    if (!regionId) throw new ForbiddenError();
    await verifyDeputyRegionAccess(requesterId, regionId);
  }
  
  if (!data.email.endsWith("@seller.com")) {
  throw new BadRequestError("Email must end with @seller.com");
}

  const existingUser = await User.findOne({ email: data.email });
  if (existingUser)
    throw new ConflictError("User with this email already exists");

  // verify position is vacant
  if (data.positionId) {
    const position = await Position.findById(data.positionId);
    if (!position) throw new NotFoundError("Position not found");
    if (position.currentHolder) {
      throw new BadRequestError("Position is already occupied");
    }
  }

  const user = await User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: data.temporaryPassword,
    role: data.role,
    grade: data.grade ?? null,
    position: data.positionId ?? null,
    mustChangePassword: true,
    createdBy: requesterId,
  });

  // assign user to position
  if (data.positionId) {
    await Position.findByIdAndUpdate(data.positionId, {
      currentHolder: user._id,
    });
  }

  return user;
};

export const updateUser = async (
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    positionId?: string | null;
  },
  requesterId: string,
  requesterRole: UserRole,
): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found");

  if (requesterRole === "deputy") {
    await verifyDeputyUserAccess(requesterId, user);

    // deputy cannot move user to position outside their superregion
    if (data.positionId) {
      const regionId = await getRegionFromPosition(data.positionId);
      if (!regionId) throw new ForbiddenError();
      await verifyDeputyRegionAccess(requesterId, regionId);
    }
  }

  // if changing position — update old and new position
  if (data.positionId !== undefined) {
    if (user.position) {
      await Position.findByIdAndUpdate(user.position, {
        currentHolder: null,
      });
    }
    if (data.positionId) {
      const newPosition = await Position.findById(data.positionId);
      if (!newPosition) throw new NotFoundError("Position not found");
      if (newPosition.currentHolder) {
        throw new BadRequestError("Position is already occupied");
      }
      await Position.findByIdAndUpdate(data.positionId, {
        currentHolder: userId,
      });
    }
  }
  const updateFields: Record<string, unknown> = {};
  if (data.firstName !== undefined) updateFields.firstName = data.firstName;
  if (data.lastName !== undefined) updateFields.lastName = data.lastName;
  if (data.email !== undefined) updateFields.email = data.email;
  if (data.positionId !== undefined) updateFields.position = data.positionId;

  const updated = await User.findByIdAndUpdate(userId, updateFields, {
    returnDocument: "after",
    runValidators: true,
  })
    .populate("position")
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

  if ((role === "advisor" || role === "salesperson") && !grade) {
    throw new BadRequestError("Grade is required for advisor and salesperson");
  }

  if (role === "director" || role === "deputy") {
    grade = null;
  }

  const updated = await User.findByIdAndUpdate(
    userId,
    { role, grade },
    { returnDocument: "after", runValidators: true },
  )
    .populate("position")
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

  if (userId === requesterId)
    throw new BadRequestError("Cannot deactivate yourself");

  if (requesterRole === "deputy") {
    await verifyDeputyUserAccess(requesterId, user);
  }

  const updated = await User.findByIdAndUpdate(
    userId,
    { isActive: !user.isActive },
    { returnDocument: "after" },
  )
    .populate("position")
    .select("-password");

  return updated!;
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found");

  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) throw new BadRequestError("Current password is incorrect");

  // prevent reusing the same password
  const isSamePassword = await user.comparePassword(newPassword);
  if (isSamePassword) throw new BadRequestError("New password must be different from current password");

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
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found");

  if (requesterRole === "deputy") {
    await verifyDeputyUserAccess(requesterId, user);
  }

  

  user.password = temporaryPassword;
  user.mustChangePassword = true;
  await user.save();
};
