import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/api/users";
import type { ArchivedUser } from "@/types";

export const useArchivedUsers = () =>
  useQuery({
    queryKey: ["archived-users"],
    queryFn: () => usersApi.getArchivedUsers().then((r) => r.data.users as ArchivedUser[]),
  });
