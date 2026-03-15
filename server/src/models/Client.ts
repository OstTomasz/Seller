import { Schema, model } from "mongoose";
import { IAddress, IClient } from "../types";
import { getNextSequence } from "./Counter";

// ─── sub-schemas ──────────────────────────────────────────────────────────────

const contactSchema = new Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phone: { type: String, trim: true, default: null },
  email: { type: String, trim: true, lowercase: true, default: null },
});

const addressSchema = new Schema({
  label: { type: String, required: true, trim: true }, // e.g. "Siedziba", "Magazyn"
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  contacts: { type: [contactSchema], default: [] },
});

// ─── main schema ──────────────────────────────────────────────────────────────

const clientSchema = new Schema<IClient>(
  {
    companyName: { type: String, required: true, trim: true },
    nip: { type: String, trim: true, default: null },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "Position",
      required: true,
    }, // salesperson position
    assignedAdvisor: {
      type: Schema.Types.ObjectId,
      ref: "Position",
      default: null,
    }, // advisor position of salesperson's region
    status: {
      type: String,
      enum: ["active", "reminder", "inactive", "archived"],
      default: "active",
    },
    lastActivityAt: {
      type: Date,
      default: null,
    },
    inactivityReason: {
      type: String, // required when status changes to inactive
      trim: true,
      default: null,
    },
    archiveRequest: {
      requestedAt: { type: Date, default: null },
      requestedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
      reason: { type: String, trim: true, default: null },
    },
    notes: { type: String, trim: true, default: null },
    addresses: {
      type: [addressSchema],
      required: true,
      validate: {
        validator: (arr: IAddress[]) => arr.length > 0,
        message: "At least one address is required",
      },
    },
    contacts: { type: [contactSchema], default: [] },
    numericId: {
  type: Number,
  unique: true,
},
  },
  { timestamps: true },
);

clientSchema.pre("save", async function () {
  if (this.isNew) {
    this.numericId = await getNextSequence("client");
  }
});

// ─── indexes ──────────────────────────────────────────────────────────────────

// fast lookup by salesperson
clientSchema.index({ assignedTo: 1 });
// fast lookup by advisor
clientSchema.index({ assignedAdvisor: 1 });
// search by company name
clientSchema.index({ companyName: "text" });
// fast lookup by status
clientSchema.index({ status: 1, lastActivityAt: 1 });

export default model<IClient>("Client", clientSchema);
