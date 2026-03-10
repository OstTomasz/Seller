import { Schema, model } from "mongoose";
import { IRegion } from "../types";

const regionSchema = new Schema<IRegion>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    parentRegion: {
      type: Schema.Types.ObjectId,
      ref: "Region",
      default: null,
    },
    deputy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

export default model<IRegion>("Region", regionSchema);
