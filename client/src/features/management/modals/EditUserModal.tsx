import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, ConfirmDialog } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/api/users";
import { toast } from "sonner";
import type { IUserNote, User } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { useConfirm } from "@/hooks/useConfirm";
import { useArchiveUser, useResetPassword, useUpdateUser, useUserNotes } from "./EditUserModal.hooks";
import {
  DirectorActionsSection,
  NotesSection,
  UserFormSection,
} from "./EditUserModal.sections";

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.email("Invalid email").endsWith("@seller.com", "Must be @seller.com"),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{7,15}$/, "Invalid phone number")
    .nullable(),
  grade: z.string().nullable(),
});

type FormData = z.infer<typeof schema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  user: User | null;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const EditUserModal = ({ user, onClose }: Props) => {
  const { mutate, isPending } = useUpdateUser(user?._id ?? "");
  const { user: currentUser } = useAuthStore();
  const isDirector = currentUser?.role === "director";

  const showGrade = user?.role === "advisor" || user?.role === "salesperson";

  const { data: userDetails } = useQuery({
    queryKey: ["user-details", user?._id ?? ""],
    queryFn: () => usersApi.getDetails(user!._id).then((r) => r.data),
    enabled: !!user?._id,
  });
  const notes = (userDetails?.user as unknown as { notes?: IUserNote[] })?.notes ?? [];
  const { add: addNote, remove: removeNote } = useUserNotes(user?._id ?? "");
  const [newNote, setNewNote] = useState("");

  const { mutate: resetPassword, isPending: isResetting } = useResetPassword(user?._id ?? "");
  const { mutate: archiveUser, isPending: isArchiving } = useArchiveUser(user?._id ?? "", onClose);

  const [tempPassword, setTempPassword] = useState("");
  const [archiveReason, setArchiveReason] = useState("");
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const handleDeleteNote = (noteId: string) => {
    removeNote.mutate(noteId, {
      onSuccess: () => toast.success("Note deleted"),
      onError: () => toast.error("Failed to delete note"),
    });
  };

  const resetConfirm = useConfirm<string>((password) => resetPassword(password));
  const deleteNoteConfirm = useConfirm<string>((noteId) => handleDeleteNote(noteId));

  const handleResetPassword = () => {
    if (!tempPassword.trim()) return;
    resetConfirm.ask(tempPassword.trim());
  };

  const handleArchive = () => {
    if (!archiveReason.trim()) return;
    archiveUser(archiveReason.trim());
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: null,
      grade: null,
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone ?? null,
        grade: user.grade ? String(user.grade) : null,
      });
    }
  }, [user, reset]);

  const onSubmit = (data: FormData) => {
    mutate(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        grade: showGrade && data.grade ? (Number(data.grade) as 1 | 2 | 3 | 4) : undefined,
      },
      {
        onSuccess: () => {
          toast.success("User updated");
          onClose();
        },
        onError: (e: unknown) => {
          const msg = (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message;
          toast.error(msg ?? "Failed to update user");
        },
      },
    );
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNote.mutate(newNote.trim(), {
      onSuccess: () => {
        toast.success("Note added");
        setNewNote("");
      },
      onError: () => toast.error("Failed to add note"),
    });
  };

  return (
    <>
      <Modal isOpen={!!user} onClose={onClose} title="Edit user" size="lg">
        <div className="flex flex-col gap-6">
          <UserFormSection
            register={register}
            errors={errors}
            showGrade={showGrade}
            isDirty={isDirty}
            isPending={isPending}
            onClose={onClose}
            onSubmit={handleSubmit(onSubmit)}
          />
          <NotesSection
            notes={notes}
            isDirector={isDirector}
            currentUserId={currentUser?._id}
            newNote={newNote}
            isAddingNote={addNote.isPending}
            onNoteChange={setNewNote}
            onAddNote={handleAddNote}
            onDeleteNote={(id) => deleteNoteConfirm.ask(id)}
          />
          <DirectorActionsSection
            show={isDirector}
            canArchive={!!isDirector && user?.role !== "director"}
            tempPassword={tempPassword}
            archiveReason={archiveReason}
            showArchiveConfirm={showArchiveConfirm}
            isResetting={isResetting}
            isArchiving={isArchiving}
            onTempPasswordChange={setTempPassword}
            onArchiveReasonChange={setArchiveReason}
            onReset={handleResetPassword}
            onArchive={handleArchive}
            onShowArchiveConfirm={setShowArchiveConfirm}
          />
        </div>
      </Modal>
      <ConfirmDialog
        isOpen={resetConfirm.isOpen}
        onClose={resetConfirm.cancel}
        onConfirm={resetConfirm.confirm}
        title="Reset password?"
        description={`Set temporary password for ${user?.firstName} ${user?.lastName}?`}
        confirmLabel="Reset"
        isLoading={isResetting}
      />
      <ConfirmDialog
        isOpen={deleteNoteConfirm.isOpen}
        onClose={deleteNoteConfirm.cancel}
        onConfirm={deleteNoteConfirm.confirm}
        title="Delete note?"
        description="Are you sure you want to delete this note?"
        isLoading={removeNote.isPending}
      />
    </>
  );
};
