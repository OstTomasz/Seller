import { Button, Card } from "@/components/ui";
import { cn, formatDate } from "@/lib/utils";
import { Download, Eye, FileText, StickyNote, Trash2 } from "lucide-react";
import type { ICompanyFile, ICompanyFileWithData, ICompanyNote } from "@seller/shared/types";

export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "application/pdf"];
export const MAX_SIZE = 1024 * 1024;

export const getAuthorName = (createdBy: ICompanyFile["createdBy"]) =>
  typeof createdBy === "object" ? `${createdBy.firstName} ${createdBy.lastName}` : "Unknown";

interface FilesCardProps {
  isDirector: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  pendingFile: { mimeType: string; size: number; data: string } | null;
  fileName: string;
  setFileName: (value: string) => void;
  isUploading: boolean;
  files: ICompanyFile[];
  isLoadingPreview: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onCancelUpload: () => void;
  onPreview: (file: ICompanyFile) => void;
  onDownload: (file: ICompanyFile) => void;
  onDelete: (id: string) => void;
}

export const FilesCard = ({
  isDirector,
  fileInputRef,
  pendingFile,
  fileName,
  setFileName,
  isUploading,
  files,
  isLoadingPreview,
  onFileChange,
  onUpload,
  onCancelUpload,
  onPreview,
  onDownload,
  onDelete,
}: FilesCardProps) => (
  <Card>
    <div className="flex items-center gap-2 mb-4">
      <FileText className="size-4 text-celery-500" />
      <h2 className="text-sm font-semibold text-celery-500 uppercase tracking-wider">Files</h2>
    </div>

    {isDirector ? (
      <div className="flex flex-col gap-3 mb-4 pb-4 border-b border-celery-700">
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.avif,.pdf"
          className="hidden"
          onChange={onFileChange}
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
              <Button variant="ghost" size="sm" onClick={onCancelUpload}>
                Cancel
              </Button>
              <Button size="sm" onClick={onUpload} disabled={!fileName.trim() || isUploading}>
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
          <div key={file._id} className="flex items-center justify-between rounded-lg px-3 py-2 bg-bg-elevated">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm text-celery-200 truncate">{file.name}</span>
              <span className="text-xs text-celery-600">
                by: {getAuthorName(file.createdBy)} · {formatDate(file.createdAt)}
              </span>
            </div>
            <div className="flex gap-1 shrink-0 ml-2">
              <button
                type="button"
                onClick={() => onPreview(file)}
                disabled={isLoadingPreview}
                className="text-celery-600 hover:text-celery-300 transition-colors p-1"
                title="Preview"
              >
                <Eye className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDownload(file)}
                className="text-celery-600 hover:text-celery-300 transition-colors p-1"
                title="Download"
              >
                <Download className="size-3.5" />
              </button>
              {isDirector ? (
                <button
                  type="button"
                  onClick={() => onDelete(file._id)}
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
);

interface NotesCardProps {
  isDirector: boolean;
  noteTitle: string;
  noteContent: string;
  notes: ICompanyNote[];
  isCreatingNote: boolean;
  setNoteTitle: (value: string) => void;
  setNoteContent: (value: string) => void;
  onAddNote: () => void;
  onDeleteNote: (id: string) => void;
}

export const NotesCard = ({
  isDirector,
  noteTitle,
  noteContent,
  notes,
  isCreatingNote,
  setNoteTitle,
  setNoteContent,
  onAddNote,
  onDeleteNote,
}: NotesCardProps) => (
  <Card>
    <div className="flex items-center gap-2 mb-4 w-3xl">
      <StickyNote className="size-4 text-celery-500" />
      <h2 className="text-sm font-semibold text-celery-500 uppercase tracking-wider">Notes</h2>
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
          placeholder="Write a note..."
          rows={3}
          className={cn(
            "w-full rounded-lg bg-bg-elevated border border-celery-700",
            "px-3 py-2 text-sm text-celery-200 resize-none",
            "focus:outline-none focus:border-celery-500",
          )}
        />
        <Button
          size="sm"
          onClick={onAddNote}
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
        notes.map((note) => (
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
                  onClick={() => onDeleteNote(note._id)}
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
);

interface PreviewModalProps {
  previewFile: ICompanyFileWithData | null;
  onClose: () => void;
}

export const PreviewModal = ({ previewFile, onClose }: PreviewModalProps) => {
  if (!previewFile) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-bg-surface rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-celery-200">{previewFile.name}</span>
          <button onClick={onClose} className="text-celery-500 hover:text-celery-200">
            ✕
          </button>
        </div>
        {previewFile.mimeType.startsWith("image/") ? (
          <img src={previewFile.data} alt={previewFile.name} className="max-w-full rounded" />
        ) : (
          <iframe src={previewFile.data} className="w-full h-[70vh] rounded" title={previewFile.name} />
        )}
      </div>
    </div>
  );
};
