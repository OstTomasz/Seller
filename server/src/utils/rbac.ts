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
