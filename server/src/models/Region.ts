import { Schema, model, Document, Types } from "mongoose";

export interface IRegion extends Document {
  name: string;
  prefix: string;
  parentRegion: Types.ObjectId | null; //null -superregion
  deputy: Types.ObjectId | null; //null-subregion
  createdAt: Date;
  updatedAt: Date;
}

const regionSchema = new Schema<IRegion>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    prefix: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    parentRegion: {
      type: Schema.Types.ObjectId,
      ref: "Region",
      default: null,
    },
    deputy: {
      type: Schema.Types.ObjectId,
      ref: "Position",
      default: null,
    },
  },
  { timestamps: true },
);

export default model<IRegion>("Region", regionSchema);
