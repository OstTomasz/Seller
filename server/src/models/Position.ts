import { Schema, model } from "mongoose";
import { IPosition } from "../types";

const positionSchema = new Schema<IPosition>(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    region: {
      type: Schema.Types.ObjectId,
      ref: "Region",
      default: null,
    },
    type: {
      type: String,
      enum: ["director", "deputy", "advisor", "salesperson"],
      required: true,
    },
    currentHolder: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

// fast lookup — find all positions in a region
positionSchema.index({ region: 1 });
// fast lookup — find position by current holder
positionSchema.index({ currentHolder: 1 });

export default model<IPosition>("Position", positionSchema);
