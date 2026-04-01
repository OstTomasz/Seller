import bcrypt from "bcryptjs";

const ROUNDS = process.env.NODE_ENV === "test" ? 1 : 12;

export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, ROUNDS);

export const comparePassword = (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);
