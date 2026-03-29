import { UserRole } from "../types";
import { BadRequestError, ForbiddenError, NotFoundError } from "../utils/errors";
import * as positionRepository from "../repositories/position.repository";
import * as regionRepository from "../repositories/region.repository";

import Client from "../models/Client";

/** Verifies deputy has access to given region */
const verifyDeputyRegionAccess = async (deputyUserId: string, regionId: string): Promise<void> => {
  const region = await regionRepository.findRegionById(regionId);
  if (!region) throw new NotFoundError("Region not found");
  if (!region.parentRegion) throw new ForbiddenError();

  const superregion = await regionRepository.findRegionById(region.parentRegion.toString());
  if (!superregion?.deputy) throw new ForbiddenError();

  const deputyPos = await positionRepository.findPositionById(superregion.deputy.toString());
  if (deputyPos?.currentHolder?.toString() !== deputyUserId) throw new ForbiddenError();
};

export const getPositions = async () => positionRepository.findAllPositionsPopulated();

export const createSalespersonPosition = async (
  regionId: string,
  code: string,
  requesterId: string,
  requesterRole: UserRole,
) => {
  if (requesterRole === "deputy") {
    await verifyDeputyRegionAccess(requesterId, regionId);
  }

  const region = await regionRepository.findRegionById(regionId);
  if (!region) throw new NotFoundError("Region not found");
  if (!region.parentRegion) throw new BadRequestError("Cannot add SP position to superregion");

  return positionRepository.createPosition({
    code,
    region: regionId,
    type: "salesperson",
    currentHolder: null,
  });
};

export const deleteSalespersonPosition = async (
  positionId: string,
  requesterId: string,
  requesterRole: UserRole,
) => {
  const position = await positionRepository.findPositionById(positionId);
  if (!position) throw new NotFoundError("Position not found");
  if (position.type !== "salesperson")
    throw new BadRequestError("Can only delete salesperson positions");
  if (position.currentHolder)
    throw new BadRequestError("Cannot delete occupied position — remove user first");

  // Check if any active clients are assigned to this position
  const clientCount = await Client.countDocuments({
    assignedTo: positionId,
    status: { $ne: "archived" },
  });
  if (clientCount > 0)
    throw new BadRequestError(`Cannot delete position with ${clientCount} active client(s)`);

  if (requesterRole === "deputy") {
    await verifyDeputyRegionAccess(requesterId, position.region!.toString());
  }

  await positionRepository.deletePositionById(positionId);
};
