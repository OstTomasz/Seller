import { Plus, Trash2 } from "lucide-react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import type { IUserNote } from "@/types";
import { getNoteAuthor } from "./EditUserModal.hooks";

interface UserFormSectionProps {
  register: (name: "firstName" | "lastName" | "email" | "phone" | "grade") => Record<string, unknown>;
  errors: {
    firstName?: { message?: string };
    lastName?: { message?: string };
    email?: { message?: string };
    phone?: { message?: string };
    grade?: { message?: string };
  };
  showGrade: boolean;
  isDirty: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
}

export const UserFormSection = ({
  register,
  errors,
  showGrade,
  isDirty,
  isPending,
  onClose,
  onSubmit,
}: UserFormSectionProps) => (
  <form onSubmit={onSubmit} className="flex flex-col gap-4">
    <div className="grid grid-cols-2 gap-4">
      <Input label="First name" error={errors.firstName?.message} {...register("firstName")} />
      <Input label="Last name" error={errors.lastName?.message} {...register("lastName")} />
    </div>
    <Input label="Email" error={errors.email?.message} {...register("email")} />
    <Input label="Phone" error={errors.phone?.message} {...register("phone")} />
    {showGrade ? (
      <Select
        label="Grade"
        error={errors.grade?.message}
        options={[1, 2, 3, 4].map((g) => ({ value: String(g), label: String(g) }))}
        placeholder="Select grade..."
        {...register("grade")}
      />
    ) : null}
    <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
      <Button variant="ghost" type="button" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit" disabled={!isDirty || isPending}>
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </div>
  </form>
);

interface NotesSectionProps {
  notes: IUserNote[];
  isDirector: boolean;
  currentUserId?: string;
  newNote: string;
  isAddingNote: boolean;
  onNoteChange: (value: string) => void;
  onAddNote: () => void;
  onDeleteNote: (id: string) => void;
}

export const NotesSection = ({
  notes,
  isDirector,
  currentUserId,
  newNote,
  isAddingNote,
  onNoteChange,
  onAddNote,
  onDeleteNote,
}: NotesSectionProps) => (
  <div className="flex flex-col gap-3 pt-4 border-t border-celery-700">
    <h3 className="text-xs font-semibold text-celery-500 uppercase tracking-wider">Notes</h3>
    {notes.length > 0 ? (
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
        {notes.map((note) => {
          const canDelete =
            isDirector || (typeof note.createdBy !== "string" && note.createdBy?._id === currentUserId);
          return (
            <div key={note._id} className="flex gap-2 p-3 rounded-lg border border-celery-700 bg-bg-base">
              <div className="flex-1 flex flex-col gap-1">
                <p className="text-sm text-celery-300 whitespace-pre-wrap">{note.content}</p>
                <span className="text-xs text-celery-600">
                  {getNoteAuthor(note.createdBy)} · {new Date(note.createdAt).toLocaleDateString("pl-PL")}
                </span>
              </div>
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => onDeleteNote(note._id)}
                  className="text-celery-600 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 className="size-3.5" />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    ) : (
      <p className="text-xs text-celery-600">No notes yet.</p>
    )}

    <div className="flex flex-col gap-2">
      <Textarea value={newNote} onChange={(e) => onNoteChange(e.target.value)} placeholder="Add a note..." rows={2} />
      <div className="flex justify-end">
        <Button type="button" size="sm" variant="ghost" onClick={onAddNote} disabled={!newNote.trim() || isAddingNote}>
          <Plus className="size-3.5 mr-1" />
          {isAddingNote ? "Adding..." : "Add note"}
        </Button>
      </div>
    </div>
  </div>
);

interface DirectorActionsSectionProps {
  show: boolean;
  canArchive: boolean;
  tempPassword: string;
  archiveReason: string;
  showArchiveConfirm: boolean;
  isResetting: boolean;
  isArchiving: boolean;
  onTempPasswordChange: (value: string) => void;
  onArchiveReasonChange: (value: string) => void;
  onReset: () => void;
  onArchive: () => void;
  onShowArchiveConfirm: (show: boolean) => void;
}

export const DirectorActionsSection = ({
  show,
  canArchive,
  tempPassword,
  archiveReason,
  showArchiveConfirm,
  isResetting,
  isArchiving,
  onTempPasswordChange,
  onArchiveReasonChange,
  onReset,
  onArchive,
  onShowArchiveConfirm,
}: DirectorActionsSectionProps) => {
  if (!show) return null;
  return (
    <>
      <div className="flex flex-col gap-3 pt-4 border-t border-celery-700">
        <h3 className="text-xs font-semibold text-celery-500 uppercase tracking-wider">Reset Password</h3>
        <div className="flex gap-2 w-full *:flex-1">
          <Input value={tempPassword} onChange={(e) => onTempPasswordChange(e.target.value)} type="text" className="h-11" />
          <Button
            type="button"
            variant="danger"
            size="lg"
            disabled={!tempPassword.trim() || isResetting}
            onClick={onReset}
            className="h-11"
          >
            {isResetting ? "Resetting..." : "Reset"}
          </Button>
        </div>
      </div>

      {canArchive ? (
        <div className="flex flex-col gap-3 pt-4 border-t border-celery-700">
          <h3 className="text-xs font-semibold text-celery-500 uppercase tracking-wider">Archive User</h3>
          {showArchiveConfirm ? (
            <div className="flex flex-col gap-2">
              <Input label="Reason" value={archiveReason} onChange={(e) => onArchiveReasonChange(e.target.value)} />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => onShowArchiveConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={!archiveReason.trim() || isArchiving}
                  onClick={onArchive}
                >
                  {isArchiving ? "Archiving..." : "Confirm archive"}
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="danger" size="sm" onClick={() => onShowArchiveConfirm(true)}>
              Archive user
            </Button>
          )}
        </div>
      ) : null}
    </>
  );
};
