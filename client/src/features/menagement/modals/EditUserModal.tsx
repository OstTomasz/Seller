import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, Button, Input, Select, Textarea, ConfirmDialog } from "@/components/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/api/users";
import { toast } from "sonner";
import type { INoteAuthor, IUserNote, User } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { Plus, Trash2 } from "lucide-react";
import { useConfirm } from "@/hooks/useConfirm";

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

// ── Helpers ───────────────────────────────────────────────────────────────────

const getNoteAuthor = (createdBy: string | INoteAuthor | null): string => {
  if (!createdBy || typeof createdBy === "string") return "Unknown";
  return `${createdBy.firstName} ${createdBy.lastName}`;
};

// ── Hooks ──────────────────────────────────────────────────────────────────────

const useUpdateUser = (userId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof usersApi.updateUser>[1]) =>
      usersApi.updateUser(userId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-users"] });
      qc.invalidateQueries({ queryKey: ["management-users"] });
      qc.invalidateQueries({ queryKey: ["user-details", userId] });
      qc.invalidateQueries({ queryKey: ["company-structure"] });
    },
  });
};

const useUserNotes = (userId: string) => {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["user-details", userId] });
    qc.invalidateQueries({ queryKey: ["all-users"] });
  };

  const add = useMutation({
    mutationFn: (content: string) => usersApi.addNote(userId, content),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (noteId: string) => usersApi.deleteNote(userId, noteId),
    onSuccess: invalidate,
  });

  return { add, remove };
};

const useResetPassword = (userId: string) =>
  useMutation({
    mutationFn: (temporaryPassword: string) => usersApi.resetPassword(userId, temporaryPassword),
    onSuccess: () => toast.success("Password reset. User must change it on next login."),
    onError: () => toast.error("Failed to reset password."),
  });

const useArchiveUser = (userId: string, onDone: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => usersApi.archiveUser(userId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-users"] });
      qc.invalidateQueries({ queryKey: ["management-users"] });
      toast.success("User archived.");
      onDone();
    },
    onError: () => toast.error("Failed to archive user."),
  });
};

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

  const resetConfirm = useConfirm<string>((password) => resetPassword(password));

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

  const handleDeleteNote = (noteId: string) => {
    removeNote.mutate(noteId, {
      onSuccess: () => toast.success("Note deleted"),
      onError: () => toast.error("Failed to delete note"),
    });
  };

  return (
    <>
      <Modal isOpen={!!user} onClose={onClose} title="Edit user" size="lg">
        <div className="flex flex-col gap-6">
          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                error={errors.firstName?.message}
                {...register("firstName")}
              />
              <Input label="Last name" error={errors.lastName?.message} {...register("lastName")} />
            </div>
            <Input label="Email" error={errors.email?.message} {...register("email")} />
            <Input label="Phone" error={errors.phone?.message} {...register("phone")} />
            {showGrade ? (
              <Select
                label="Grade"
                error={errors.grade?.message}
                options={[1, 2, 3, 4].map((g) => ({ value: String(g), label: String(g) }))}
                placeholder="Select grade…"
                {...register("grade")}
              />
            ) : null}
            <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
              <Button variant="ghost" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!isDirty || isPending}>
                {isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>

          {/* Notes section */}
          <div className="flex flex-col gap-3 pt-4 border-t border-celery-700">
            <h3 className="text-xs font-semibold text-celery-500 uppercase tracking-wider">
              Notes
            </h3>

            {/* Existing notes */}
            {notes.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {notes.map((note) => {
                  const canDelete =
                    isDirector ||
                    (typeof note.createdBy !== "string" &&
                      note.createdBy?._id === currentUser?._id);
                  return (
                    <div
                      key={note._id}
                      className="flex gap-2 p-3 rounded-lg border border-celery-700 bg-bg-base"
                    >
                      <div className="flex-1 flex flex-col gap-1">
                        <p className="text-sm text-celery-300 whitespace-pre-wrap">
                          {note.content}
                        </p>
                        <span className="text-xs text-celery-600">
                          {getNoteAuthor(note.createdBy)} ·{" "}
                          {new Date(note.createdAt).toLocaleDateString("pl-PL")}
                        </span>
                      </div>
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note._id)}
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

            {/* Add note */}
            <div className="flex flex-col gap-2">
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note…"
                rows={2}
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || addNote.isPending}
                >
                  <Plus className="size-3.5 mr-1" />
                  {addNote.isPending ? "Adding…" : "Add note"}
                </Button>
              </div>
            </div>

            {isDirector ? (
              <div className="flex flex-col gap-3 pt-4 border-t border-celery-700">
                <h3 className="text-xs font-semibold text-celery-500 uppercase tracking-wider">
                  Reset Password
                </h3>
                <div className="flex gap-2 w-full *:flex-1">
                  <Input
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    type="text"
                    className="h-11"
                  />
                  <Button
                    type="button"
                    variant="danger"
                    size="lg"
                    disabled={!tempPassword.trim() || isResetting}
                    onClick={handleResetPassword}
                    className="h-11"
                  >
                    {isResetting ? "Resetting…" : "Reset"}
                  </Button>
                </div>
              </div>
            ) : null}

            {/* Archive — tylko director */}
            {isDirector ? (
              <div className="flex flex-col gap-3 pt-4 border-t border-celery-700">
                <h3 className="text-xs font-semibold text-celery-500 uppercase tracking-wider">
                  Archive User
                </h3>
                {showArchiveConfirm ? (
                  <div className="flex flex-col gap-2">
                    <Input
                      label="Reason"
                      value={archiveReason}
                      onChange={(e) => setArchiveReason(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowArchiveConfirm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={!archiveReason.trim() || isArchiving}
                        onClick={handleArchive}
                      >
                        {isArchiving ? "Archiving…" : "Confirm archive"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setShowArchiveConfirm(true)}
                  >
                    Archive user
                  </Button>
                )}
              </div>
            ) : null}
          </div>
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
    </>
  );
};
