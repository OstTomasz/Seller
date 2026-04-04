import User from "../models/User";
import type { IUser, UserGrade, UserRole } from "../types";

/**
 * Returns all users with populated position, without password field.
 */
export const findAllUsers = async (): Promise<IUser[]> =>
  User.find().populate("position").select("-password").sort({ lastName: 1, firstName: 1 });

export const findAllUsersForInvite = async () =>
  User.find({ isActive: true, position: { $ne: null } })
    .populate({
      path: "position",
      populate: {
        path: "region",
        populate: { path: "parentRegion" },
      },
    })
    .select("-password")
    .sort({ lastName: 1, firstName: 1 });

/**
 * Returns a populated user without password, or null if not found.
 */
export const findUserById = async (userId: string): Promise<IUser | null> =>
  User.findById(userId).populate("position").select("-password");

/**
 * Returns a raw user document (with password) by id.
 */
export const findRawUserById = async (userId: string) => User.findById(userId);

/**
 * Returns a raw user document by email.
 */
export const findUserByEmail = async (email: string) => User.findOne({ email });

/**
 * Returns a raw active user by email (with password) for authentication.
 */
export const findActiveUserByEmail = async (email: string) =>
  User.findOne({ email, isActive: true });

/**
 * Returns all salesperson users with populated position and region.
 */
export const findSalespersonUsers = async (): Promise<IUser[]> =>
  User.find({ role: "salesperson", isActive: true })
    .populate({
      path: "position",
      populate: {
        path: "region",
        select: "name parentRegion",
        populate: { path: "parentRegion", select: "name" },
      },
    })
    .select("-password");

/**
 * Creates a new user with the given data.
 */
export const createUser = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  grade: UserGrade | null;
  position: string | null;
  createdBy: string;
}): Promise<IUser> =>
  User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: data.password,
    phone: data.phone,
    role: data.role,
    grade: data.grade,
    position: data.position,
    mustChangePassword: true,
    createdBy: data.createdBy,
  });

/**
 * Updates user by id and returns populated user without password.
 */
export const updateUserById = async (
  userId: string,
  update: Record<string, unknown>,
): Promise<IUser | null> =>
  User.findByIdAndUpdate(userId, update, {
    returnDocument: "after",
    runValidators: true,
  })
    .populate("position")
    .select("-password");

/**
 * Toggles user active flag and returns populated user without password.
 */
export const toggleUserActiveById = async (
  userId: string,
  isActive: boolean,
): Promise<IUser | null> =>
  User.findByIdAndUpdate(userId, { isActive }, { returnDocument: "after" })
    .populate("position")
    .select("-password");

/**
 * Updates user role and grade and returns populated user without password.
 */
export const updateUserRoleAndGradeById = async (
  userId: string,
  role: UserRole,
  grade: UserGrade | null,
): Promise<IUser | null> =>
  User.findByIdAndUpdate(userId, { role, grade }, { returnDocument: "after", runValidators: true })
    .populate("position")
    .select("-password");

/**
 * Returns all active users with a specific role.
 */
export const findUsersByRole = async (role: UserRole): Promise<IUser[]> =>
  User.find({ role, isActive: true }).select("-password");

/**
 * Returns users by array of IDs.
 */
export const findUsersByIds = async (userIds: string[]): Promise<IUser[]> =>
  User.find({ _id: { $in: userIds }, isActive: true }).select("-password");

export const findUserByIdWithPosition = async (userId: string) =>
  User.findById(userId)
    .select("-password")
    .populate({
      path: "position",
      populate: {
        path: "region",
        populate: { path: "parentRegion", select: "name prefix" },
      },
    })
    .populate("notes.createdBy", "firstName lastName role");

export const findArchivedUsers = async () =>
  User.find({ isActive: false }).select("-password").sort({ archivedAt: -1 });

export const addNoteToUser = async (userId: string, content: string, createdBy: string) =>
  User.findByIdAndUpdate(
    userId,
    { $push: { notes: { content, createdBy, createdAt: new Date(), updatedAt: new Date() } } },
    { returnDocument: "after" },
  ).select("-password");

export const updateUserNote = async (userId: string, noteId: string, content: string) =>
  User.findOneAndUpdate(
    { _id: userId, "notes._id": noteId },
    { $set: { "notes.$.content": content, "notes.$.updatedAt": new Date() } },
    { returnDocument: "after" },
  ).select("-password");

export const deleteUserNote = async (userId: string, noteId: string) =>
  User.findByIdAndUpdate(
    userId,
    { $pull: { notes: { _id: noteId } } },
    { returnDocument: "after" },
  ).select("-password");
