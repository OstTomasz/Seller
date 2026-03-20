import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/api/users";
import type { UserRole } from "@/types";

/**
 * Fetches salespersons — only for deputy and director.
 */
export const useSalespersons = (role: UserRole) => {
  return useQuery({
    queryKey: ["salespersons"],
    queryFn: async () => {
      const { data } = await usersApi.getSalespersons();
      return data.users;
    },
    enabled: role === "deputy" || role === "director" || role === "advisor",
  });
};
