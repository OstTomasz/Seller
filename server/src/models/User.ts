import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser, UserRole } from "../types";

const ROLES: UserRole[] = ["director", "deputy", "advisor", "salesperson"];

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    role: {
      type: String,
      enum: ROLES,
      required: true,
    },
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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Hashowanie hasła przed zapisem
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Metoda do weryfikacji hasła przy logowaniu
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Nigdy nie zwracaj hasła w odpowiedzi API
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

export default model<IUser>("User", userSchema);
