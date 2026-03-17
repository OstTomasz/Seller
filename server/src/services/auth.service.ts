import { env } from "../config/env";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { IUser, TokenPayload } from "../types";
import { UnauthorizedError, NotFoundError } from "../utils/errors";

// login resp
interface LoginResult {
  user: IUser;
  token: string;
}

const generateToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "7d",
  });
};
export const generateTokenForUser = (user: IUser): string => {
  return generateToken(user);
};

export const login = async (email: string, password: string) => {
  const user = await User.findOne({ email, isActive: true });
  if (!user) throw new UnauthorizedError("Invalid credentials");

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) throw new UnauthorizedError("Invalid credentials");

  const token = generateToken(user);
  return { user, token };
};

export const getMe = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId).populate("position");
  if (!user) throw new NotFoundError("User not found");
  return user;
};
