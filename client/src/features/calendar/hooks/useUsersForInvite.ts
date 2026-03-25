import { useQuery } from "@tanstack/react-query";
import { fetchAllUsersForInvite } from "@/api/calendar";

export const useUsersForInvite = () =>
  useQuery({
    queryKey: ["users-for-invite"],
    queryFn: fetchAllUsersForInvite,
  });
