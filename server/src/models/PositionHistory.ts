import { Schema, model, Document, Types } from "mongoose";

export interface IPositionHistory extends Document {
  positionId: Types.ObjectId;
  userId: Types.ObjectId;
  assignedAt: Date;
  removedAt: Date | null;
}

const positionHistorySchema = new Schema<IPositionHistory>(
  {
    positionId: { type: Schema.Types.ObjectId, ref: "Position", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedAt: { type: Date, required: true, default: Date.now },
    removedAt: { type: Date, default: null },
  },
  { timestamps: false },
);

positionHistorySchema.index({ positionId: 1, assignedAt: -1 });

export default model<IPositionHistory>("PositionHistory", positionHistorySchema);
