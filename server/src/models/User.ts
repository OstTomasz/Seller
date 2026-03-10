import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser, UserRole } from "../types";

const ROLES: UserRole[] = ["director", "deputy", "advisor", "salesperson"];

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ROLES, required: true },
    grade: {
      type: Number,
      enum: [1, 2, 3, 4],
      default: null,
    },
    region: {
      type: Schema.Types.ObjectId,
      ref: "Region",
      default: null,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// validating before saving - grade and region are required for advisor and salesperson
userSchema.pre("save", async function () {
  const rolesRequiringRegion: UserRole[] = ["advisor", "salesperson"];

  if (rolesRequiringRegion.includes(this.role)) {
    if (!this.region) {
      throw new Error("Region is required for advisor and salesperson");
    }
    if (!this.grade) {
      throw new Error("Grade is required for advisor and salesperson");
    }
  }

  // pwd hash
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

export default model<IUser>("User", userSchema);
