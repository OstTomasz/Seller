import { Request, Response, NextFunction } from "express";
import * as regionService from "../services/region.service";
import { UserRole } from "../types";
import { BadRequestError } from "../utils/errors";

export const createRegion = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, prefix, parentRegionId } = req.body;

    if (!name || !prefix) {
      next(new BadRequestError("Name and prefix are required"));
      return;
    }

    const region = await regionService.createRegion(
      name,
      prefix,
      req.userId!,
      req.userRole as UserRole,
      parentRegionId,
    );
    res.status(201).json({ region });
  } catch (error) {
    next(error);
  }
};

export const updateRegionName = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { name } = req.body;
    if (!name) {
      next(new BadRequestError("Name is required"));
      return;
    }

    const region = await regionService.updateRegionName(
      id,
      name,
      req.userId!,
      req.userRole as UserRole,
    );
    res.status(200).json({ region });
  } catch (error) {
    next(error);
  }
};

export const updateRegionDeputy = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { deputyId } = req.body;

    const region = await regionService.updateRegionDeputy(
      id,
      deputyId ?? null,
      req.userRole as UserRole,
    );
    res.status(200).json({ region });
  } catch (error) {
    next(error);
  }
};

export const deleteRegion = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    await regionService.deleteRegion(id, req.userId!, req.userRole as UserRole);
    res.status(200).json({ message: "Region deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const getRegions = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const regions = await regionService.getRegions();
    res.status(200).json({ regions });
  } catch (error) {
    next(error);
  }
};

export const getRegionById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const region = await regionService.getRegionById(id);
    res.status(200).json({ region });
  } catch (error) {
    next(error);
  }
};
