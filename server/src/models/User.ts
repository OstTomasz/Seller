import { hashPassword, comparePassword } from "../utils/hash";
import { Schema, model } from "mongoose";
import { IUser, UserRole } from "../types";
import { getNextSequence } from "./Counter";

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
    position: {
      type: Schema.Types.ObjectId,
      ref: "Position",
      default: null,
    },
    isActive: { type: Boolean, default: true },
    mustChangePassword: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    numericId: {
      type: Number,
      unique: true,
    },
  },
  { timestamps: true },
);

// validating before saving - grade and position are required for advisor and salesperson
userSchema.pre("save", async function () {
  const rolesRequiringPosition: UserRole[] = ["advisor", "salesperson"];

  if (this.isNew) {
    this.numericId = await getNextSequence("user");
  }

  if (rolesRequiringPosition.includes(this.role)) {
    if (!this.position) {
      throw new Error("Position is required for advisor and salesperson");
    }
    if (!this.grade) {
      throw new Error("Grade is required for advisor and salesperson");
    }
  }

  if (this.isModified("password")) {
    this.password = await hashPassword(this.password);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return comparePassword(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

export default model<IUser>("User", userSchema);
