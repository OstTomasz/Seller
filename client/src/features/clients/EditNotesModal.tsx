import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Modal, Button, ConfirmDialog } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Client, INoteAuthor } from "@/types";
import type { INote } from "@/types";
import { useConfirm } from "@/hooks/useConfirm";
import { useAddNote, useUpdateNote, useDeleteNote } from "./hooks/useUpdateClient";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";

const noteSchema = z.object({ content: z.string().min(1, "Note cannot be empty") });
type NoteFormValues = z.infer<typeof noteSchema>;

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <span className="min-h-4 text-xs text-red-400">{message}</span>
  ) : (
    <span className="min-h-4" />
  );

const getNoteAuthor = (createdBy: string | INoteAuthor | null): string => {
  if (!createdBy) return "Unknown";
  if (typeof createdBy === "string") return "Unknown";
  return `${createdBy.firstName} ${createdBy.lastName}`;
};

const getCreatedById = (createdBy: string | INoteAuthor | null): string => {
  if (!createdBy) return "";
  if (typeof createdBy === "string") return createdBy;
  return createdBy._id;
};

interface EditNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  currentUserId: string;
}

export const EditNotesModal = ({ isOpen, onClose, client, currentUserId }: EditNotesModalProps) => {
  // null = new note, string = edited noteId
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const isDirty = editingNoteId !== null || isAdding;
  const discard = useDiscardConfirm(isDirty, () => {
    setEditingNoteId(null);
    setIsAdding(false);
    editForm.reset();
    addForm.reset();
    onClose();
  });

  const addNote = useAddNote(client._id);
  const updateNote = useUpdateNote(client._id);
  const deleteNote = useDeleteNote(client._id);

  const deleteConfirm = useConfirm<string>((noteId) => deleteNote.mutate(noteId));

  // ── Add form ───────────────────────────────────────────────────────────────

  const addForm = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { content: "" },
  });

  const onAdd = async (values: NoteFormValues) => {
    await addNote.mutateAsync(values.content);
    addForm.reset();
    setIsAdding(false);
  };

  // ── Edit form ──────────────────────────────────────────────────────────────

  const editForm = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { content: "" },
  });

  const startEditing = (note: INote) => {
    setEditingNoteId(note._id);
    editForm.setValue("content", note.content);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    editForm.reset();
  };

  const onEdit = async (values: NoteFormValues) => {
    if (!editingNoteId) return;
    await updateNote.mutateAsync({ noteId: editingNoteId, content: values.content });
    cancelEditing();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Notes" size="lg">
        <div className="flex flex-col gap-4">
          {/* ── notes list ────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
            {client.notes.length === 0 ? (
              <p className="text-sm text-celery-600">No notes yet</p>
            ) : (
              client.notes.map((note) => {
                const isEditing = editingNoteId === note._id;

                return (
                  <div
                    key={note._id}
                    className="flex flex-col gap-2 p-3 rounded-lg border border-celery-700 bg-bg-base"
                  >
                    {isEditing ? (
                      // ── edit mode ───────────────────────────────────────
                      <form
                        onSubmit={editForm.handleSubmit(onEdit)}
                        className="flex flex-col gap-2"
                      >
                        <textarea
                          {...editForm.register("content")}
                          rows={3}
                          className={cn(
                            "w-full rounded-lg bg-bg-elevated border border-celery-700",
                            "px-3 py-2 text-sm text-celery-200 resize-none",
                            "focus:outline-none focus:border-celery-500",
                          )}
                        />
                        <FieldError message={editForm.formState.errors.content?.message} />
                        <div className="flex justify-end gap-2">
                          <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={cancelEditing}
                              disabled={updateNote.isPending}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={updateNote.isPending || !editForm.formState.isDirty}
                            >
                              {updateNote.isPending ? "Saving..." : "Save"}
                            </Button>
                          </div>
                        </div>
                      </form>
                    ) : (
                      // ── preview mode ─────────────────────────────────────
                      <>
                        <p className="text-sm text-celery-300 whitespace-pre-wrap">
                          {note.content}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-celery-600">
                              {new Date(note.createdAt).toLocaleDateString("pl-PL")}
                            </span>
                            <span className="text-xs text-celery-500">
                              {getNoteAuthor(note.createdBy)}
                            </span>
                          </div>
                          {getCreatedById(note.createdBy) === currentUserId ? (
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-celery-500 hover:text-celery-300 p-1"
                                onClick={() => startEditing(note)}
                              >
                                <Pencil size={13} />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 p-1"
                                onClick={() => deleteConfirm.ask(note._id)}
                              >
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* ── add note ────────────────────────────────────────────────── */}
          {isAdding ? (
            <form
              onSubmit={addForm.handleSubmit(onAdd)}
              className="flex flex-col gap-2 pt-2 border-t border-celery-700"
            >
              <label className="text-xs text-celery-500">New note</label>
              <textarea
                {...addForm.register("content")}
                rows={3}
                placeholder="Write a note..."
                className={cn(
                  "w-full rounded-lg bg-bg-elevated border border-celery-700",
                  "px-3 py-2 text-sm text-celery-200 resize-none",
                  "focus:outline-none focus:border-celery-500",
                )}
              />
              <FieldError message={addForm.formState.errors.content?.message} />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAdding(false);
                    addForm.reset();
                  }}
                  disabled={addNote.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={addNote.isPending}>
                  {addNote.isPending ? "Adding..." : "Add note"}
                </Button>
              </div>
            </form>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start text-celery-500"
              onClick={() => setIsAdding(true)}
            >
              <Plus size={14} className="mr-1" />
              Add note
            </Button>
          )}
        </div>

        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={deleteConfirm.cancel}
          onConfirm={deleteConfirm.confirm}
          title="Delete note"
          description="Are you sure you want to delete this note?"
          isLoading={deleteNote.isPending}
        />
      </Modal>
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={deleteConfirm.cancel}
        onConfirm={deleteConfirm.confirm}
        title="Delete note"
        description="Are you sure you want to delete this note?"
        isLoading={deleteNote.isPending}
      />
      <ConfirmDialog
        isOpen={discard.isOpen}
        onClose={discard.cancel}
        onConfirm={discard.confirm}
        title="Discard changes?"
        description="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard"
      />
    </>
  );
};
