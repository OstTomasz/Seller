import { useRef, useState } from "react";
import { FetchError, ConfirmDialog, SplitCardsSkeleton } from "@/components/ui";
import { useAuthStore } from "@/store/authStore";
import { useConfirm } from "@/hooks/useConfirm";
import {
  useCompanyFiles,
  useCompanyNotes,
  useUploadFile,
  useDeleteFile,
  useCreateNote,
  useDeleteNote,
} from "../hooks/useCompanyDocuments";
import { companyDocumentsApi } from "@/api/companyDocuments";
import type { ICompanyFile, ICompanyFileWithData } from "@seller/shared/types";
import { toast } from "sonner";
import {
  ALLOWED_TYPES,
  FilesCard,
  MAX_SIZE,
  NotesCard,
  PreviewModal,
} from "./CompanyDocumentsPage.sections";

// ── Component ─────────────────────────────────────────────────────────────────

/** Company-wide documents and notes page */
export const CompanyDocumentsPage = () => {
  const { user } = useAuthStore();
  const isDirector = user?.role === "director";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [pendingFile, setPendingFile] = useState<{
    mimeType: string;
    size: number;
    data: string;
  } | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [previewFile, setPreviewFile] = useState<ICompanyFileWithData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");

  const { data: files = [], isLoading: filesLoading, isError: filesError } = useCompanyFiles();
  const { data: notes = [], isLoading: notesLoading, isError: notesError } = useCompanyNotes();
  const { mutate: uploadFile, isPending: isUploading } = useUploadFile();
  const { mutate: deleteFile } = useDeleteFile();
  const { mutate: createNote, isPending: isCreatingNote } = useCreateNote();
  const { mutate: deleteNote } = useDeleteNote();

  const deleteFileConfirm = useConfirm<string>((id) => deleteFile(id));
  const deleteNoteConfirm = useConfirm<string>((id) => deleteNote(id));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Unsupported format. Use JPG, PNG, WebP, AVIF or PDF.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("File too large. Maximum size is 1MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPendingFile({ mimeType: file.type, size: file.size, data: reader.result as string });
      setFileName(file.name.replace(/\.[^.]+$/, ""));
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!pendingFile || !fileName.trim()) return;
    uploadFile(
      { name: fileName.trim(), ...pendingFile },
      {
        onSuccess: () => {
          setPendingFile(null);
          setFileName("");
          if (fileInputRef.current) fileInputRef.current.value = "";
        },
      },
    );
  };

  const handlePreview = async (file: ICompanyFile) => {
    setIsLoadingPreview(true);
    try {
      const { data } = await companyDocumentsApi.getFileById(file._id);
      setPreviewFile(data.file);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleDownload = async (file: ICompanyFile) => {
    const { data } = await companyDocumentsApi.getFileById(file._id);
    const a = document.createElement("a");
    a.href = data.file.data;
    a.download = file.name;
    a.click();
  };

  const handleAddNote = () => {
    if (!noteTitle.trim() || !noteContent.trim()) return;
    createNote(
      { title: noteTitle.trim(), content: noteContent.trim() },
      {
        onSuccess: () => {
          setNoteTitle("");
          setNoteContent("");
        },
      },
    );
  };

  if (filesLoading || notesLoading) return <SplitCardsSkeleton />;
  if (filesError || notesError) return <FetchError label="documents" />;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FilesCard
          isDirector={isDirector}
          fileInputRef={fileInputRef}
          pendingFile={pendingFile}
          fileName={fileName}
          setFileName={setFileName}
          isUploading={isUploading}
          files={files}
          isLoadingPreview={isLoadingPreview}
          onFileChange={handleFileChange}
          onUpload={handleUpload}
          onCancelUpload={() => {
            setPendingFile(null);
            setFileName("");
          }}
          onPreview={handlePreview}
          onDownload={handleDownload}
          onDelete={(id) => deleteFileConfirm.ask(id)}
        />
        <NotesCard
          isDirector={isDirector}
          noteTitle={noteTitle}
          noteContent={noteContent}
          notes={notes}
          isCreatingNote={isCreatingNote}
          setNoteTitle={setNoteTitle}
          setNoteContent={setNoteContent}
          onAddNote={handleAddNote}
          onDeleteNote={(id) => deleteNoteConfirm.ask(id)}
        />
      </div>

      <PreviewModal previewFile={previewFile} onClose={() => setPreviewFile(null)} />

      <ConfirmDialog
        isOpen={deleteFileConfirm.isOpen}
        onClose={deleteFileConfirm.cancel}
        onConfirm={deleteFileConfirm.confirm}
        title="Delete file?"
        description="This action cannot be undone."
        confirmLabel="Delete"
      />
      <ConfirmDialog
        isOpen={deleteNoteConfirm.isOpen}
        onClose={deleteNoteConfirm.cancel}
        onConfirm={deleteNoteConfirm.confirm}
        title="Delete note?"
        description="This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
};
