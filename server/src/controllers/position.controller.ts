import { Request, Response } from "express";
import * as positionService from "../services/position.service";
import * as positionHistoryRepository from "../repositories/positionHistory.repository";
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

export const updateCode = wrapAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { code } = req.body;
  if (!code) throw new BadRequestError("code is required");
  const position = await positionService.updatePositionCode(
    id,
    code,
    req.userId!,
    req.userRole as UserRole,
  );
  res.status(200).json({ position });
});

export const getPositionHistory = wrapAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const history = await positionHistoryRepository.findHistoryByPositionId(id);
  res.status(200).json({ history });
});
