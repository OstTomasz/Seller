import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/api/users";
import { buildHierarchy, type HierarchyNode } from "../utils/buildHierarchy";
import type { UserForInvite } from "@/types";

/** Fetches all users and builds the company hierarchy tree */
export const useCompanyStructure = () =>
  useQuery({
    queryKey: ["company-structure"],
    queryFn: async (): Promise<HierarchyNode> => {
      const res = await usersApi.getAllForStructure();
      const users = res.data.users as UserForInvite[];
      return buildHierarchy(users);
    },
    staleTime: 5 * 60 * 1000,
  });
