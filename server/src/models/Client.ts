import { Schema, model, Document, Types } from "mongoose";

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

export interface IContact {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
}

export interface IAddress {
  _id: Types.ObjectId;
  label: string;
  street: string;
  city: string;
  postalCode: string;
  contacts: IContact[];
}

export interface IClient extends Document {
  companyName: string;
  nip: string | null;
  assignedTo: Types.ObjectId;
  isActive: boolean;
  notes: string | null;
  addresses: IAddress[];
  contacts: IContact[]; // general contacts not tied to address
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    companyName: { type: String, required: true, trim: true },
    nip: { type: String, trim: true, default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isActive: { type: Boolean, default: true },
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
  },
  { timestamps: true },
);

// ─── indexes ──────────────────────────────────────────────────────────────────

// fast lookup by assigned salesperson
clientSchema.index({ assignedTo: 1 });
// search by company name
clientSchema.index({ companyName: "text" });

export default model<IClient>("Client", clientSchema);
