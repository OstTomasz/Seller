import Region from "../models/Region";
import { IRegion, UserRole } from "../types";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../utils/errors";

const verifyDeputyAccess = async (
  deputyId: string,
  regionId: string,
): Promise<void> => {
  const region = await Region.findById(regionId);

  if (!region) throw new NotFoundError("Region not found");
  if (!region.parentRegion) throw new ForbiddenError();

  const superregion = await Region.findById(region.parentRegion);

  if (!superregion || superregion.deputy?.toString() !== deputyId) {
    throw new ForbiddenError();
  }
};

export const createRegion = async (
  name: string,
  requesterId: string,
  requesterRole: UserRole,
  parentRegionId?: string,
): Promise<IRegion> => {
  if (requesterRole === "deputy") {
    if (!parentRegionId) throw new ForbiddenError();
    await verifyDeputyAccess(requesterId, parentRegionId);
  }

  const region = await Region.create({
    name,
    parentRegion: parentRegionId || null,
  });

  return region;
};

export const updateRegionName = async (
  regionId: string,
  name: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IRegion> => {
  if (requesterRole === "deputy") {
    await verifyDeputyAccess(requesterId, regionId);
  }

  const region = await Region.findByIdAndUpdate(
    regionId,
    { name },
    { new: true, runValidators: true },
  );

  if (!region) throw new NotFoundError("Region not found");
  return region;
};

export const updateRegionDeputy = async (
  regionId: string,
  deputyId: string | null,
  requesterRole: UserRole,
): Promise<IRegion> => {
  if (requesterRole !== "director") throw new ForbiddenError();

  const region = await Region.findById(regionId);
  if (!region) throw new NotFoundError("Region not found");

  if (region.parentRegion !== null) {
    throw new BadRequestError("Only superregions can have a deputy");
  }

  const updated = await Region.findByIdAndUpdate(
    regionId,
    { deputy: deputyId },
    { new: true },
  ).populate("deputy");

  return updated!;
};

export const deleteRegion = async (
  regionId: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<void> => {
  const region = await Region.findById(regionId);
  if (!region) throw new NotFoundError("Region not found");

  if (requesterRole === "deputy") {
    if (!region.parentRegion) throw new ForbiddenError();
    await verifyDeputyAccess(requesterId, regionId);
  }

  const hasChildren = await Region.exists({ parentRegion: regionId });
  if (hasChildren)
    throw new BadRequestError("Cannot delete region with subregions");

  await Region.findByIdAndDelete(regionId);
};

export const getRegions = async (): Promise<IRegion[]> => {
  return await Region.find().populate("deputy").sort({ createdAt: 1 });
};

export const getRegionById = async (regionId: string): Promise<IRegion> => {
  const region = await Region.findById(regionId).populate("deputy");
  if (!region) throw new NotFoundError("Region not found");
  return region;
};
