import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/api/users";
import type { UserWithProfile } from "@/types";

export const useUserDetails = (id: string) =>
  useQuery({
    queryKey: ["user-details", id],
    queryFn: (): Promise<UserWithProfile> => usersApi.getDetails(id).then((r) => r.data),
    enabled: !!id,
  });
