import { IRegion, UserRole } from "../types";
import { BadRequestError, ForbiddenError, NotFoundError } from "../utils/errors";
import * as regionRepository from "../repositories/region.repository";
import * as positionRepository from "../repositories/position.repository";
import * as userRepository from "../repositories/user.repository";

// ─── helpers ──────────────────────────────────────────────────────────────────

const getDeputyUserId = async (region: IRegion): Promise<string | null> => {
  if (!region.deputy) return null;

  const position = await positionRepository.findPositionById(region.deputy.toString());
  return position?.currentHolder?.toString() ?? null;
};

const verifyDeputyAccess = async (deputyUserId: string, regionId: string): Promise<void> => {
  const region = await regionRepository.findRegionById(regionId);
  if (!region) throw new NotFoundError("Region not found");

  // if superregion — check deputy position directly
  if (!region.parentRegion) {
    const holderId = await getDeputyUserId(region);
    if (holderId !== deputyUserId) throw new ForbiddenError();
    return;
  }

  // if subregion — check parent superregion's deputy position
  const superregion = await regionRepository.findRegionById(region.parentRegion.toString());
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

  const region = await regionRepository.createRegion({
    name,
    prefix,
    parentRegion: parentRegionId || null,
  });

  // auto-create position for the new region
  if (!parentRegionId) {
    // superregion → create deputy position e.g. "NP-1"
    const deputyPosition = await positionRepository.createPosition({
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
    await positionRepository.createPosition({
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
    const region = await regionRepository.findRegionById(regionId);
    if (!region) throw new NotFoundError("Region not found");

    // deputy can only rename subregions, not superregions
    if (!region.parentRegion) throw new ForbiddenError();

    await verifyDeputyAccess(requesterId, regionId);
  }

  const region = await regionRepository.updateRegionById(regionId, { name });

  if (!region) throw new NotFoundError("Region not found");
  return region;
};

export const updateRegionPrefix = async (
  regionId: string,
  prefix: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IRegion> => {
  const region = await regionRepository.findRegionById(regionId);
  if (!region) throw new NotFoundError("Region not found");
  if (requesterRole === "deputy") await verifyDeputyAccess(requesterId, regionId);

  const existing = await regionRepository.findRegionByPrefix(prefix);
  if (existing && existing._id.toString() !== regionId)
    throw new BadRequestError("Prefix already in use");

  const updated = await regionRepository.updateRegionById(regionId, { prefix });
  if (!updated) throw new NotFoundError("Region not found");
  return updated;
};

export const updateRegionDeputy = async (
  regionId: string,
  deputyUserId: string | null,
  requesterRole: UserRole,
): Promise<IRegion> => {
  if (requesterRole !== "director") throw new ForbiddenError();

  const region = await regionRepository.findRegionById(regionId);
  if (!region) throw new NotFoundError("Region not found");
  if (region.parentRegion !== null)
    throw new BadRequestError("Only superregions can have a deputy");
  if (!region.deputy) throw new BadRequestError("Superregion has no deputy position");

  const deputyPos = await positionRepository.findPositionById(region.deputy.toString());
  if (deputyPos?.currentHolder) {
    await userRepository.updateUserById(deputyPos.currentHolder.toString(), { position: null });
  }

  await positionRepository.updatePositionCurrentHolder(region.deputy.toString(), deputyUserId);

  if (deputyUserId) {
    await userRepository.updateUserById(deputyUserId, {
      position: region.deputy,
      role: "deputy",
      grade: null,
    });
  }

  const updated = await regionRepository.findRegionByIdPopulated(regionId);
  return updated!;
};

export const deleteRegion = async (
  regionId: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<void> => {
  const region = await regionRepository.findRegionById(regionId);
  if (!region) throw new NotFoundError("Region not found");

  if (requesterRole === "deputy") {
    if (!region.parentRegion) throw new ForbiddenError();
    await verifyDeputyAccess(requesterId, regionId);
  }

  const hasChildren = await regionRepository.regionHasChildren(regionId);
  if (hasChildren) throw new BadRequestError("Cannot delete region with subregions");

  // delete all positions in this region
  await positionRepository.deletePositionsByRegionId(regionId);

  await regionRepository.deleteRegionById(regionId);
};

export const getRegions = async (): Promise<IRegion[]> => {
  return (await regionRepository.findAllRegionsPopulated()) as IRegion[];
};

export const getRegionById = async (regionId: string): Promise<IRegion> => {
  const region = await regionRepository.findRegionByIdPopulated(regionId);
  if (!region) throw new NotFoundError("Region not found");
  return region;
};

export const getRegionByPrefix = async (prefix: string): Promise<IRegion> => {
  const region = await regionRepository.findRegionByPrefix(prefix);
  if (!region) throw new NotFoundError("Region not found");
  return region;
};

export const moveRegionToSuperregion = async (
  regionId: string,
  newParentId: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IRegion> => {
  if (requesterRole === "deputy") throw new ForbiddenError();

  const region = await regionRepository.findRegionById(regionId);
  if (!region) throw new NotFoundError("Region not found");
  if (!region.parentRegion) throw new BadRequestError("Cannot move a superregion");

  const newParent = await regionRepository.findRegionById(newParentId);
  if (!newParent) throw new NotFoundError("Target superregion not found");
  if (newParent.parentRegion) throw new BadRequestError("Target must be a superregion");

  const updated = await regionRepository.updateRegionById(regionId, { parentRegion: newParentId });
  if (!updated) throw new NotFoundError("Region not found");
  return updated;
};
