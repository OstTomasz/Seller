import { CompanyFile } from "../models/CompanyFile";
import { ICompanyFile } from "../types";

export const findAllFiles = async (): Promise<ICompanyFile[]> =>
  CompanyFile.find()
    .populate("createdBy", "firstName lastName role")
    .sort({ createdAt: -1 })
    .select("-data");

export const findFileById = async (id: string): Promise<ICompanyFile | null> =>
  CompanyFile.findById(id).populate("createdBy", "firstName lastName role");

export const createFile = async (
  data: Omit<ICompanyFile, "_id" | "createdAt">,
): Promise<ICompanyFile> => CompanyFile.create(data);

export const deleteFileById = async (id: string): Promise<ICompanyFile | null> =>
  CompanyFile.findByIdAndDelete(id);
