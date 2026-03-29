import { Request, Response } from "express";
import * as positionService from "../services/position.service";
import { UserRole } from "../types";
import { BadRequestError } from "../utils/errors";
import { wrapAsync } from "../utils/wrapAsync";

export const getPositions = wrapAsync(async (_req: Request, res: Response) => {
  const positions = await positionService.getPositions();
  res.status(200).json({ positions });
});

export const createPosition = wrapAsync(async (req: Request, res: Response) => {
  const { regionId, code } = req.body;
  if (!regionId || !code) throw new BadRequestError("regionId and code are required");

  const position = await positionService.createSalespersonPosition(
    regionId,
    code,
    req.userId!,
    req.userRole as UserRole,
  );
  res.status(201).json({ position });
});

export const deletePosition = wrapAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await positionService.deleteSalespersonPosition(id, req.userId!, req.userRole as UserRole);
  res.status(200).json({ message: "Position deleted successfully" });
});
