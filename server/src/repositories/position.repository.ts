import { Types } from "mongoose";
import Position from "../models/Position";

export const findPositionById = async (positionId: string) => Position.findById(positionId);

export const createPosition = async (data: {
  code: string;
  region: string | Types.ObjectId;
  type: "director" | "deputy" | "advisor" | "salesperson";
  currentHolder: string | Types.ObjectId | null;
}) => Position.create(data);

export const findAdvisorPositionByRegionId = async (regionId: string) =>
  Position.findOne({ region: regionId, type: "advisor" });

export const findPositionsByRegionIds = async (regionIds: string[]) =>
  Position.find({ region: { $in: regionIds } });

export const updatePositionCurrentHolder = async (
  positionId: string,
  currentHolderUserId: string | null,
) =>
  Position.findByIdAndUpdate(
    positionId,
    { currentHolder: currentHolderUserId },
    { returnDocument: "after" },
  );

export const clearPositionCurrentHolder = async (positionId: string) =>
  Position.findByIdAndUpdate(positionId, { currentHolder: null });

export const deletePositionsByRegionId = async (regionId: string) =>
  Position.deleteMany({ region: regionId });

export const findPositionByUserId = async (userId: string) =>
  Position.findOne({ currentHolder: userId }).populate("region");

export const findAllPositionsPopulated = async () =>
  Position.find()
    .populate("region")
    .populate("currentHolder", "firstName lastName numericId role grade")
    .sort({ code: 1 });

export const findPositionsByType = async (type: string) =>
  Position.find({ type })
    .populate("region")
    .populate("currentHolder", "firstName lastName numericId");

export const deletePositionById = async (positionId: string) =>
  Position.findByIdAndDelete(positionId);

export const updatePositionCode = async (positionId: string, code: string) =>
  Position.findByIdAndUpdate(
    positionId,
    { code: code.toUpperCase() },
    { returnDocument: "after", runValidators: true },
  );
