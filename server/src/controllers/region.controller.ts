import { Request, Response, NextFunction } from "express";
import * as regionService from "../services/region.service";
import { UserRole } from "../types";
import { BadRequestError } from "../utils/errors";
import { wrapAsync } from "../utils/wrapAsync";
import { updateRegionPrefixSchema } from "@seller/shared/types";

export const createRegion = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { name, prefix, parentRegionId } = req.body;

    if (!name || !prefix) {
      throw new BadRequestError("Name and prefix are required");
    }

    const region = await regionService.createRegion(
      name,
      prefix,
      req.userId!,
      req.userRole as UserRole,
      parentRegionId,
    );
    res.status(201).json({ region });
  },
);

export const updateRegionName = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const { name } = req.body;
    if (!name) {
      throw new BadRequestError("Name is required");
    }

    const region = await regionService.updateRegionName(
      id,
      name,
      req.userId!,
      req.userRole as UserRole,
    );
    res.status(200).json({ region });
  },
);

export const updateRegionDeputy = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const { deputyId } = req.body;

    const region = await regionService.updateRegionDeputy(
      id,
      deputyId ?? null,
      req.userRole as UserRole,
    );
    res.status(200).json({ region });
  },
);

export const deleteRegion = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    await regionService.deleteRegion(id, req.userId!, req.userRole as UserRole);
    res.status(200).json({ message: "Region deleted successfully" });
  },
);

export const getRegions = wrapAsync(
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const regions = await regionService.getRegions();
    res.status(200).json({ regions });
  },
);

export const getRegionById = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const region = await regionService.getRegionById(id);
    res.status(200).json({ region });
  },
);

export const moveRegion = wrapAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { newParentId } = req.body;
  if (!newParentId) throw new BadRequestError("newParentId is required");

  const region = await regionService.moveRegionToSuperregion(
    id,
    newParentId,
    req.userId!,
    req.userRole as UserRole,
  );
  res.status(200).json({ region });
});

export const updateRegionPrefix = wrapAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { prefix } = updateRegionPrefixSchema.parse(req.body);
  const region = await regionService.updateRegionPrefix(
    id,
    prefix,
    req.userId!,
    req.userRole as UserRole,
  );
  res.json({ status: "success", data: { region } });
});
