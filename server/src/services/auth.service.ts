import jwt from "jsonwebtoken";
import User from "../models/User";
import { IUser, TokenPayload } from "../types";

// login resp
interface LoginResult {
  user: IUser;
  token: string;
}

const generateToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
};

export const login = async (
  email: string,
  password: string,
): Promise<LoginResult> => {
  const user = await User.findOne({ email, isActive: true });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const token = generateToken(user);

  return { user, token };
};

export const getMe = async (userId: string): Promise<IUser> => {
  try {
    const user = await User.findById(userId).populate("region");

    if (!user) {
      throw new Error("User not found");
    }
    return user;
  } catch (error) {
    throw error;
  }
};
