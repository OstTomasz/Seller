import { Schema, model } from "mongoose";
import { ICompanyNote } from "src/types";

const companyNoteSchema = new Schema<ICompanyNote>(
  {
    content: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export const CompanyNote = model<ICompanyNote>("CompanyNote", companyNoteSchema);
