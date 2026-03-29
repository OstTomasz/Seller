import { Schema, model, Document, Types } from "mongoose";

export interface IUserProfileDocument extends Document {
  userId: Types.ObjectId;
  description: string | null;
  workplace: string | null;
  avatarIndex: number;
  avatar: string | null;
  lastLoginAt: Date | null;
}

const userProfileSchema = new Schema<IUserProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    description: { type: String, default: null, trim: true },
    workplace: { type: String, default: null, trim: true },
    avatarIndex: { type: Number, default: 0, min: 0, max: 4 },
    avatar: { type: String, default: null }, // base64 string
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default model<IUserProfileDocument>("UserProfile", userProfileSchema);
