import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usersApi } from "@/api/users";
import type { INoteAuthor } from "@/types";

export const getNoteAuthor = (createdBy: string | INoteAuthor | null): string => {
  if (!createdBy || typeof createdBy === "string") return "Unknown";
  return `${createdBy.firstName} ${createdBy.lastName}`;
};

export const useUpdateUser = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof usersApi.updateUser>[1]) =>
      usersApi.updateUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      queryClient.invalidateQueries({ queryKey: ["management-users"] });
      queryClient.invalidateQueries({ queryKey: ["user-details", userId] });
      queryClient.invalidateQueries({ queryKey: ["company-structure"] });
    },
  });
};

export const useUserNotes = (userId: string) => {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["user-details", userId] });
    queryClient.invalidateQueries({ queryKey: ["all-users"] });
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

export const useResetPassword = (userId: string) =>
  useMutation({
    mutationFn: (temporaryPassword: string) => usersApi.resetPassword(userId, temporaryPassword),
    onSuccess: () => toast.success("Password reset. User must change it on next login."),
    onError: () => toast.error("Failed to reset password."),
  });

export const useArchiveUser = (userId: string, onDone: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => usersApi.archiveUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      queryClient.invalidateQueries({ queryKey: ["management-users"] });
      toast.success("User archived.");
      onDone();
    },
    onError: () => toast.error("Failed to archive user."),
  });
};
