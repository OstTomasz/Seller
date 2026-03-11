import { Request, Response } from "express";
import * as authService from "../services/auth.service";

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const { user, token } = await authService.login(email, password);

    res.status(200).json({ user, token });
  } catch (error) {
    res.status(401).json({ message: "Invalid credentials" });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await authService.getMe(req.userId);
    res.status(200).json({ user });
  } catch (error) {
    res.status(404).json({ message: "User not found" });
  }
};
