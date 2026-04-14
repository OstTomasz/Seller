import { useRef, useState } from "react";
import { Loader, FetchError, Button, Card, ConfirmDialog } from "@/components/ui";
import { FileText, StickyNote, Trash2, Download, Eye } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { formatDate } from "@/lib/utils";
import { useConfirm } from "@/hooks/useConfirm";
import { cn } from "@/lib/utils";
import {
  useCompanyFiles,
  useCompanyNotes,
  useUploadFile,
  useDeleteFile,
  useCreateNote,
  useDeleteNote,
} from "./hooks/useCompanyDocuments";
import { companyDocumentsApi } from "@/api/companyDocuments";
import type { ICompanyFile, ICompanyFileWithData, ICompanyNote } from "@seller/shared/types";
import { toast } from "sonner";

// ── Helpers ───────────────────────────────────────────────────────────────────

const getAuthorName = (createdBy: ICompanyFile["createdBy"]) =>
  typeof createdBy === "object" ? `${createdBy.firstName} ${createdBy.lastName}` : "Unknown";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "application/pdf"];
const MAX_SIZE = 1024 * 1024;

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

  if (filesLoading || notesLoading) return <Loader label="documents" />;
  if (filesError || notesError) return <FetchError label="documents" />;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Files ──────────────────────────────────────────────── */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="size-4 text-celery-500" />
            <h2 className="text-sm font-semibold text-celery-500 uppercase tracking-wider">
              Files
            </h2>
          </div>

          {isDirector ? (
            <div className="flex flex-col gap-3 mb-4 pb-4 border-b border-celery-700">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.avif,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              {pendingFile ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="File name"
                    className="w-full rounded-lg bg-bg-elevated border border-celery-700 px-3 py-2 text-sm text-celery-200 focus:outline-none focus:border-celery-500"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPendingFile(null);
                        setFileName("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleUpload}
                      disabled={!fileName.trim() || isUploading}
                    >
                      {isUploading ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                  + Add file
                </Button>
              )}
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            {files.length === 0 ? (
              <p className="text-sm text-celery-600 italic">No files yet.</p>
            ) : (
              files.map((file) => (
                <div
                  key={file._id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 bg-bg-elevated"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm text-celery-200 truncate">{file.name}</span>
                    <span className="text-xs text-celery-600">
                      by: {getAuthorName(file.createdBy)} · {formatDate(file.createdAt)}
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => handlePreview(file)}
                      disabled={isLoadingPreview}
                      className="text-celery-600 hover:text-celery-300 transition-colors p-1"
                      title="Preview"
                    >
                      <Eye className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(file)}
                      className="text-celery-600 hover:text-celery-300 transition-colors p-1"
                      title="Download"
                    >
                      <Download className="size-3.5" />
                    </button>
                    {isDirector ? (
                      <button
                        type="button"
                        onClick={() => deleteFileConfirm.ask(file._id)}
                        className="text-celery-600 hover:text-red-400 transition-colors p-1"
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* ── Notes ──────────────────────────────────────────────── */}
        <Card>
          <div className="flex items-center gap-2 mb-4 w-3xl">
            <StickyNote className="size-4 text-celery-500" />
            <h2 className="text-sm font-semibold text-celery-500 uppercase tracking-wider">
              Notes
            </h2>
          </div>

          {isDirector ? (
            <div className="flex flex-col gap-2 mb-4 pb-4 border-b border-celery-700">
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note title"
                className="w-full rounded-lg bg-bg-elevated border border-celery-700 px-3 py-2 text-sm text-celery-200 focus:outline-none focus:border-celery-500"
              />
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write a note…"
                rows={3}
                className={cn(
                  "w-full rounded-lg bg-bg-elevated border border-celery-700",
                  "px-3 py-2 text-sm text-celery-200 resize-none",
                  "focus:outline-none focus:border-celery-500",
                )}
              />
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={!noteTitle.trim() || !noteContent.trim() || isCreatingNote}
                className="self-end"
              >
                {isCreatingNote ? "Adding..." : "Add note"}
              </Button>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            {notes.length === 0 ? (
              <p className="text-sm text-celery-600 italic">No notes yet.</p>
            ) : (
              notes.map((note: ICompanyNote) => (
                <div key={note._id} className="flex flex-col gap-1 rounded-lg p-3 bg-bg-elevated">
                  <p className="text-sm font-medium text-celery-100">{note.title}</p>
                  <p className="text-sm text-celery-200 whitespace-pre-wrap">{note.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-celery-600">
                      by: {getAuthorName(note.createdBy)} · {formatDate(note.createdAt)}
                    </span>
                    {isDirector ? (
                      <button
                        type="button"
                        onClick={() => deleteNoteConfirm.ask(note._id)}
                        className="text-celery-600 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Preview modal */}
      {previewFile ? (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-bg-surface rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-celery-200">{previewFile.name}</span>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-celery-500 hover:text-celery-200"
              >
                ✕
              </button>
            </div>
            {previewFile.mimeType.startsWith("image/") ? (
              <img src={previewFile.data} alt={previewFile.name} className="max-w-full rounded" />
            ) : (
              <iframe
                src={previewFile.data}
                className="w-full h-[70vh] rounded"
                title={previewFile.name}
              />
            )}
          </div>
        </div>
      ) : null}

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
