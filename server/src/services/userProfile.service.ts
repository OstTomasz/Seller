import * as userRepo from "../repositories/user.repository";
import * as profileRepo from "../repositories/userProfile.repository";
import { NotFoundError } from "../utils/errors";

/** Returns user with populated position + their profile (nullable) */
export const getUserWithProfile = async (userId: string) => {
  const user = await userRepo.findUserByIdWithPosition(userId);
  if (!user) throw new NotFoundError("User not found");

  const profile = await profileRepo.findProfileByUserId(userId);
  return { user, profile: profile ?? null };
};

export const upsertUserProfile = async (
  userId: string,
  requesterId: string,
  data: Parameters<typeof profileRepo.upsertProfile>[1],
) => {
  const user = await userRepo.findUserByIdWithPosition(userId);
  if (!user) throw new NotFoundError("User not found");

  // Only the user themselves can update their own profile (settings page later)
  // Director/deputy can also update — enforced at route level via requireRole
  const profile = await profileRepo.upsertProfile(userId, data);
  return { user, profile };
};
