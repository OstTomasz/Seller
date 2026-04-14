import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyDocumentsApi } from "@/api/companyDocuments";
import { toast } from "sonner";

const KEYS = {
  files: ["company-files"],
  notes: ["company-notes"],
} as const;

const invalidate = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: KEYS.files });
  qc.invalidateQueries({ queryKey: KEYS.notes });
};

export const useCompanyFiles = () =>
  useQuery({
    queryKey: KEYS.files,
    queryFn: () => companyDocumentsApi.getFiles().then((r) => r.data.files),
  });

export const useCompanyNotes = () =>
  useQuery({
    queryKey: KEYS.notes,
    queryFn: () => companyDocumentsApi.getNotes().then((r) => r.data.notes),
  });

export const useUploadFile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: companyDocumentsApi.uploadFile,
    onSuccess: () => {
      toast.success("File uploaded");
      invalidate(qc);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Failed to upload file");
    },
  });
};

export const useDeleteFile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: companyDocumentsApi.deleteFile,
    onSuccess: () => {
      toast.success("File deleted");
      invalidate(qc);
    },
    onError: () => toast.error("Failed to delete file"),
  });
};

export const useCreateNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: companyDocumentsApi.createNote,
    onSuccess: () => {
      toast.success("Note added");
      invalidate(qc);
    },
    onError: () => toast.error("Failed to add note"),
  });
};

export const useDeleteNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: companyDocumentsApi.deleteNote,
    onSuccess: () => {
      toast.success("Note deleted");
      invalidate(qc);
    },
    onError: () => toast.error("Failed to delete note"),
  });
};
