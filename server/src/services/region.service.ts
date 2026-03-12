import Region from "../models/Region";
import Position from "../models/Position";
import { IRegion, UserRole } from "../types";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../utils/errors";

// ─── helpers ──────────────────────────────────────────────────────────────────

const getDeputyUserId = async (region: IRegion): Promise<string | null> => {
  if (!region.deputy) return null;

  const position = await Position.findById(region.deputy);
  return position?.currentHolder?.toString() ?? null;
};

const verifyDeputyAccess = async (
  deputyUserId: string,
  regionId: string,
): Promise<void> => {
  const region = await Region.findById(regionId);
  if (!region) throw new NotFoundError("Region not found");

  // if superregion — check deputy position directly
  if (!region.parentRegion) {
    const holderId = await getDeputyUserId(region);
    if (holderId !== deputyUserId) throw new ForbiddenError();
    return;
  }

  // if subregion — check parent superregion's deputy position
  const superregion = await Region.findById(region.parentRegion);
  if (!superregion) throw new NotFoundError("Superregion not found");

  const holderId = await getDeputyUserId(superregion);
  if (holderId !== deputyUserId) throw new ForbiddenError();
};

// ─── service functions ────────────────────────────────────────────────────────

export const createRegion = async (
  name: string,
  prefix: string,
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
    prefix,
    parentRegion: parentRegionId || null,
  });

  // auto-create position for the new region
  if (!parentRegionId) {
    // superregion → create deputy position e.g. "NP-1"
    const deputyPosition = await Position.create({
      code: `${prefix}-1`,
      region: region._id,
      type: "deputy",
      currentHolder: null,
    });

    // assign deputy position to region
    region.deputy = deputyPosition._id;
    await region.save();
  } else {
    // subregion → create advisor position e.g. "PO-1"
    await Position.create({
      code: `${prefix}-1`,
      region: region._id,
      type: "advisor",
      currentHolder: null,
    });
  }

  return region;
};

export const updateRegionName = async (
  regionId: string,
  name: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IRegion> => {
  if (requesterRole === "deputy") {
    const region = await Region.findById(regionId);
    if (!region) throw new NotFoundError("Region not found");

    // deputy can only rename subregions, not superregions
    if (!region.parentRegion) throw new ForbiddenError();

    await verifyDeputyAccess(requesterId, regionId);
  }

  const region = await Region.findByIdAndUpdate(
    regionId,
    { name },
    { returnDocument: "after", runValidators: true },
  );

  if (!region) throw new NotFoundError("Region not found");
  return region;
};

export const updateRegionDeputy = async (
  regionId: string,
  deputyUserId: string | null,
  requesterRole: UserRole,
): Promise<IRegion> => {
  if (requesterRole !== "director") throw new ForbiddenError();

  const region = await Region.findById(regionId);
  if (!region) throw new NotFoundError("Region not found");

  if (region.parentRegion !== null) {
    throw new BadRequestError("Only superregions can have a deputy");
  }

  if (!region.deputy) {
    throw new BadRequestError("Superregion has no deputy position");
  }

  // update currentHolder on the deputy position
  await Position.findByIdAndUpdate(region.deputy, {
    currentHolder: deputyUserId,
  });

  // update user's position reference
  if (deputyUserId) {
    const User = (await import("../models/User")).default;
    await User.findByIdAndUpdate(deputyUserId, { position: region.deputy });
  }

  const updated = await Region.findById(regionId).populate("deputy");
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

  // delete all positions in this region
  await Position.deleteMany({ region: regionId });

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

export const getRegionByPrefix = async (prefix: string): Promise<IRegion> => {
  const region = await Region.findOne({ prefix });
  if (!region) throw new NotFoundError("Region not found");
  return region;
};
