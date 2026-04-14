import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, ConfirmDialog } from "@/components/ui";
import type { Client, INoteAuthor, UserRole } from "@/types";
import type { INote } from "@/types";
import { useConfirm } from "@/hooks/useConfirm";
import { useAddNote, useUpdateNote, useDeleteNote } from "../hooks/useUpdateClient";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import {
  AddNoteButton,
  AddNoteForm,
  NoteEditForm,
  NotePreviewRow,
} from "./EditNotesModal.sections";

const noteSchema = z.object({ content: z.string().min(1, "Note cannot be empty") });
type NoteFormValues = z.infer<typeof noteSchema>;

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
  userRole: UserRole;
}

export const EditNotesModal = ({
  isOpen,
  onClose,
  client,
  currentUserId,
  userRole,
}: EditNotesModalProps) => {
  // null = new note, string = edited noteId
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // ── Add form ───────────────────────────────────────────────────────────────
  const addForm = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { content: "" },
  });

  // ── Edit form ──────────────────────────────────────────────────────────────
  const editForm = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { content: "" },
  });

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

  const canDeleteNote = (note: INote): boolean => {
    const authorId = getCreatedById(note.createdBy);
    const authorRole =
      typeof note.createdBy === "object" && note.createdBy !== null ? note.createdBy.role : null;
    if (userRole === "director") return true;
    if (authorId === currentUserId) return true;
    if (userRole === "deputy") return authorRole !== "director";
    return false;
  };

  const deleteConfirm = useConfirm<string>((noteId) => deleteNote.mutate(noteId));

  const onAdd = async (values: NoteFormValues) => {
    await addNote.mutateAsync(values.content);
    addForm.reset();
    setIsAdding(false);
  };

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
                      <NoteEditForm
                        register={editForm.register}
                        error={editForm.formState.errors.content?.message}
                        isDirty={editForm.formState.isDirty}
                        isPending={updateNote.isPending}
                        onSubmit={editForm.handleSubmit(onEdit)}
                        onCancel={cancelEditing}
                      />
                    ) : (
                      // ── preview mode ─────────────────────────────────────
                      <NotePreviewRow
                        note={note}
                        canEdit={getCreatedById(note.createdBy) === currentUserId}
                        canDelete={canDeleteNote(note)}
                        getAuthorName={(item) => getNoteAuthor(item.createdBy)}
                        onStartEdit={startEditing}
                        onDelete={(noteId) => deleteConfirm.ask(noteId)}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* ── add note ────────────────────────────────────────────────── */}
          {isAdding ? (
            <AddNoteForm
              isPending={addNote.isPending}
              register={addForm.register}
              error={addForm.formState.errors.content?.message}
              onSubmit={addForm.handleSubmit(onAdd)}
              onCancel={() => {
                setIsAdding(false);
                addForm.reset();
              }}
            />
          ) : (
            <AddNoteButton onClick={() => setIsAdding(true)} />
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
