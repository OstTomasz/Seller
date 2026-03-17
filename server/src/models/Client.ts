// server/src/models/Client.ts
import { Schema, model } from "mongoose";
import { IAddress, IClient } from "../types";
import { getNextSequence } from "./Counter";

const contactSchema = new Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phone: { type: String, trim: true, default: null },
  email: { type: String, trim: true, lowercase: true, default: null },
});

const addressSchema = new Schema({
  label: { type: String, required: true, trim: true },
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  contacts: { type: [contactSchema], default: [] },
});

const noteSchema = new Schema(
  {
    content: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

const clientSchema = new Schema<IClient>(
  {
    numericId: { type: Number, unique: true },
    companyName: { type: String, required: true, trim: true },
    nip: { type: String, trim: true, default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: "Position", required: true },
    assignedAdvisor: { type: Schema.Types.ObjectId, ref: "Position", default: null },
    status: {
      type: String,
      enum: ["active", "reminder", "inactive", "archived"],
      default: "active",
    },
    lastActivityAt: { type: Date, default: null },
    inactivityReason: { type: String, trim: true, default: null },
    archiveRequest: {
      requestedAt: { type: Date, default: null },
      requestedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
      reason: { type: String, trim: true, default: null },
    },
    notes: { type: [noteSchema], default: [] },
    addresses: {
      type: [addressSchema],
      required: true,
      validate: {
        validator: (arr: IAddress[]) => arr.length > 0,
        message: "At least one address is required",
      },
    },
    contacts: { type: [contactSchema], default: [] },
  },
  { timestamps: true },
);

clientSchema.pre("save", async function () {
  if (this.isNew) {
    this.numericId = await getNextSequence("client");
  }
});

clientSchema.index({ assignedTo: 1 });
clientSchema.index({ assignedAdvisor: 1 });
clientSchema.index({ companyName: "text" });
clientSchema.index({ status: 1, lastActivityAt: 1 });

export default model<IClient>("Client", clientSchema);
