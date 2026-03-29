import UserProfile from "../models/UserProfile";

export const findProfileByUserId = async (userId: string) => UserProfile.findOne({ userId });

export const upsertProfile = async (
  userId: string,
  data: Partial<{
    phone: string | null;
    email: string | null;
    description: string | null;
    workplace: string | null;
    avatarIndex: number;
    hiredAt: string | null;
  }>,
) =>
  UserProfile.findOneAndUpdate(
    { userId },
    { $set: data },
    { upsert: true, new: true, runValidators: true },
  );

export const updateLastLogin = async (userId: string) =>
  UserProfile.findOneAndUpdate(
    { userId },
    { $set: { lastLoginAt: new Date() } },
    { upsert: true, new: true },
  );
