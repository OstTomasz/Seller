import Position from "../models/Position";

export const findPositionById = async (positionId: string) => Position.findById(positionId);

export const createPosition = async (data: {
  code: string;
  region: unknown;
  type: "director" | "deputy" | "advisor" | "salesperson";
  currentHolder: unknown;
}) => Position.create(data);

export const findAdvisorPositionByRegionId = async (regionId: string) =>
  Position.findOne({ region: regionId, type: "advisor" });

export const findPositionsByRegionIds = async (regionIds: string[]) =>
  Position.find({ region: { $in: regionIds } });

export const updatePositionCurrentHolder = async (
  positionId: string,
  currentHolderUserId: string | null,
) =>
  Position.findByIdAndUpdate(positionId, { currentHolder: currentHolderUserId });

export const clearPositionCurrentHolder = async (positionId: string) =>
  Position.findByIdAndUpdate(positionId, { currentHolder: null });

export const deletePositionsByRegionId = async (regionId: string) =>
  Position.deleteMany({ region: regionId });

