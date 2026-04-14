import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { INote } from "@/types";

export const FieldError = ({ message }: { message?: string }) =>
  message ? <span className="min-h-4 text-xs text-red-400">{message}</span> : <span className="min-h-4" />;

interface NoteEditFormProps {
  register: (name: "content") => Record<string, unknown>;
  error?: string;
  isDirty: boolean;
  isPending: boolean;
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
  onCancel: () => void;
}

export const NoteEditForm = ({
  register,
  error,
  isDirty,
  isPending,
  onSubmit,
  onCancel,
}: NoteEditFormProps) => (
  <form onSubmit={onSubmit} className="flex flex-col gap-2">
    <textarea
      {...register("content")}
      rows={3}
      className={cn(
        "w-full rounded-lg bg-bg-elevated border border-celery-700",
        "px-3 py-2 text-sm text-celery-200 resize-none",
        "focus:outline-none focus:border-celery-500",
      )}
    />
    <FieldError message={error} />
    <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
      <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
        Cancel
      </Button>
      <Button type="submit" disabled={isPending || !isDirty}>
        {isPending ? "Saving..." : "Save"}
      </Button>
    </div>
  </form>
);

interface NotePreviewRowProps {
  note: INote;
  canEdit: boolean;
  canDelete: boolean;
  getAuthorName: (note: INote) => string;
  onStartEdit: (note: INote) => void;
  onDelete: (id: string) => void;
}

export const NotePreviewRow = ({
  note,
  canEdit,
  canDelete,
  getAuthorName,
  onStartEdit,
  onDelete,
}: NotePreviewRowProps) => (
  <>
    <p className="text-sm text-celery-300 whitespace-pre-wrap">{note.content}</p>
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-celery-600">{new Date(note.createdAt).toLocaleDateString("pl-PL")}</span>
        <span className="text-xs text-celery-500">{getAuthorName(note)}</span>
      </div>
      <div className="flex gap-1">
        {canEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-celery-500 hover:text-celery-300 p-1"
            onClick={() => onStartEdit(note)}
          >
            <Pencil size={13} />
          </Button>
        ) : null}
        {canDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300 p-1"
            onClick={() => onDelete(note._id)}
          >
            <Trash2 size={13} />
          </Button>
        ) : null}
      </div>
    </div>
  </>
);

interface AddNoteFormProps {
  isPending: boolean;
  register: (name: "content") => Record<string, unknown>;
  error?: string;
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
  onCancel: () => void;
}

export const AddNoteForm = ({ isPending, register, error, onSubmit, onCancel }: AddNoteFormProps) => (
  <form onSubmit={onSubmit} className="flex flex-col gap-2 pt-2 border-t border-celery-700">
    <label className="text-xs text-celery-500">New note</label>
    <textarea
      {...register("content")}
      rows={3}
      placeholder="Write a note..."
      className={cn(
        "w-full rounded-lg bg-bg-elevated border border-celery-700",
        "px-3 py-2 text-sm text-celery-200 resize-none",
        "focus:outline-none focus:border-celery-500",
      )}
    />
    <FieldError message={error} />
    <div className="flex justify-end gap-2">
      <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
        Cancel
      </Button>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Adding..." : "Add note"}
      </Button>
    </div>
  </form>
);

export const AddNoteButton = ({ onClick }: { onClick: () => void }) => (
  <Button type="button" variant="ghost" size="sm" className="self-start text-celery-500" onClick={onClick}>
    <Plus size={14} className="mr-1" />
    Add note
  </Button>
);
