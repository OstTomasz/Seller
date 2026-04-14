import { CompanyNote } from "../models/CompanyNote";
import { ICompanyNote } from "../types";

export const findAllNotes = async (): Promise<ICompanyNote[]> =>
  CompanyNote.find().populate("createdBy", "firstName lastName role").sort({ createdAt: -1 });

export const createNote = async (data: {
  title: string;
  content: string;
  createdBy: string;
}): Promise<ICompanyNote> => CompanyNote.create(data);

export const deleteNoteById = async (id: string): Promise<ICompanyNote | null> =>
  CompanyNote.findByIdAndDelete(id);
