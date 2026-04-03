// client/src/features/archive/hooks/useArchivedUsers.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/api/users";
import { toast } from "sonner";

export const useArchivedUsers = () =>
  useQuery({
    queryKey: ["archived-users"],
    queryFn: () => usersApi.getArchivedUsers().then((r) => r.data.users),
  });

/** Mutation for unarchiving a user. Invalidates archived-users cache. */
export const useUnarchiveUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.unarchiveUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archived-users"] });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      queryClient.invalidateQueries({ queryKey: ["management-users"] });
      toast.success("User unarchived.");
    },
    onError: () => toast.error("Failed to unarchive user."),
  });
};
