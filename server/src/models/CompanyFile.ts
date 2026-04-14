import { Schema, model } from "mongoose";
import { ICompanyFile } from "src/types";

const companyFileSchema = new Schema<ICompanyFile>(
  {
    name: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: String, required: true }, // base64
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const CompanyFile = model<ICompanyFile>("CompanyFile", companyFileSchema);
