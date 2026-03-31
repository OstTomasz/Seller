import PositionHistory from "../models/PositionHistory";

export const createHistoryEntry = async (positionId: string, userId: string) =>
  PositionHistory.create({ positionId, userId, assignedAt: new Date() });

export const closeHistoryEntry = async (positionId: string, userId: string) =>
  PositionHistory.findOneAndUpdate(
    { positionId, userId, removedAt: null },
    { removedAt: new Date() },
    { sort: { assignedAt: -1 } },
  );

export const findHistoryByPositionId = async (positionId: string) =>
  PositionHistory.find({ positionId })
    .populate("userId", "firstName lastName numericId")
    .sort({ assignedAt: -1 });
