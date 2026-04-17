import { model } from "mongoose";
import { companyFileWithDataSchema, ICompanyFile } from "src/types";

export const CompanyFile = model<ICompanyFile>("CompanyFile", companyFileWithDataSchema);
