import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/api/users";
import type { UserWithProfile } from "@/types";

export const useMyProfile = () =>
  useQuery({
    queryKey: ["my-profile"],
    queryFn: (): Promise<UserWithProfile> => usersApi.getMyProfile().then((r) => r.data),
  });

export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.updateMyProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-profile"] }),
  });
};
