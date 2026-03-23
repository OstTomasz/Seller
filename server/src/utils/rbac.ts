import * as userRepository from "../repositories/user.repository";
import * as positionRepository from "../repositories/position.repository";
import * as regionRepository from "../repositories/region.repository";

/**
 * Returns all position IDs within the superregion managed by the given deputy.
 */
export const getPositionIdsInSuperregion = async (deputyUserId: string): Promise<string[]> => {
  const deputyUser = await userRepository.findRawUserById(deputyUserId);
  if (!deputyUser?.position) return [];

  const deputyPosition = await positionRepository.findPositionById(deputyUser.position.toString());
  if (!deputyPosition?.region) return [];

  const superregionId = deputyPosition.region.toString();
  const subregions = await regionRepository.findSubregionsByParentId(superregionId);
  const subregionIds = subregions.map((r) => r._id.toString());

  const positions = await positionRepository.findPositionsByRegionIds(subregionIds);
  return positions.map((p) => p._id.toString());
};

/**
 * Returns all active user IDs subordinate to a deputy (all users in their superregion).
 */
export const getSubordinateUserIdsForDeputy = async (deputyUserId: string): Promise<string[]> => {
  const deputyUser = await userRepository.findRawUserById(deputyUserId);
  if (!deputyUser?.position) return [];

  const deputyPosition = await positionRepository.findPositionById(deputyUser.position.toString());
  if (!deputyPosition?.region) return [];

  return getUserIdsBySuperregionId(deputyPosition.region.toString());
};

/**
 * Returns all active user IDs subordinate to a director (all users in system except directors).
 */
export const getSubordinateUserIdsForDirector = async (): Promise<string[]> => {
  const users = await userRepository.findAllUsers();
  return users.filter((u) => u.role !== "director" && u.isActive).map((u) => u._id.toString());
};

/**
 * Returns subordinate user IDs for a given region.
 */
export const getUserIdsByRegionId = async (regionId: string): Promise<string[]> => {
  const positions = await positionRepository.findPositionsByRegionIds([regionId]);
  const userIds: string[] = [];
  for (const pos of positions) {
    if (pos.currentHolder) userIds.push(pos.currentHolder.toString());
  }
  return [...new Set(userIds)];
};

/**
 * Returns subordinate user IDs for a given superregion.
 */
export const getUserIdsBySuperregionId = async (superregionId: string): Promise<string[]> => {
  const subregions = await regionRepository.findSubregionsByParentId(superregionId);
  const subregionIds = subregions.map((r) => r._id.toString());
  if (subregionIds.length === 0) return [];

  const positions = await positionRepository.findPositionsByRegionIds(subregionIds);
  const userIds: string[] = [];
  for (const pos of positions) {
    if (pos.currentHolder) userIds.push(pos.currentHolder.toString());
  }
  return [...new Set(userIds)];
};
