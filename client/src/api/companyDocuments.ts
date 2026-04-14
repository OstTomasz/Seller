import { api } from "@/lib/axios";
import type { ICompanyFile, ICompanyFileWithData, ICompanyNote } from "@seller/shared/types";

export const companyDocumentsApi = {
  getFiles: () => api.get<{ files: ICompanyFile[] }>("/company-documents/files"),
  getFileById: (id: string) =>
    api.get<{ file: ICompanyFileWithData }>(`/company-documents/files/${id}`),
  uploadFile: (data: { name: string; mimeType: string; size: number; data: string }) =>
    api.post("/company-documents/files", data),
  deleteFile: (id: string) => api.delete(`/company-documents/files/${id}`),
  getNotes: () => api.get<{ notes: ICompanyNote[] }>("/company-documents/notes"),
  createNote: (data: { title: string; content: string }) =>
    api.post("/company-documents/notes", data),

  deleteNote: (id: string) => api.delete(`/company-documents/notes/${id}`),
};
