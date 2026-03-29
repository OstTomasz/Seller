import { Request, Response } from "express";
import * as userProfileService from "../services/userProfile.service";
import { wrapAsync } from "../utils/wrapAsync";

export const getUserWithProfile = wrapAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await userProfileService.getUserWithProfile(id);
  res.status(200).json(result);
});

export const upsertUserProfile = wrapAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await userProfileService.upsertUserProfile(id, req.userId!, req.body);
  res.status(200).json(result);
});
