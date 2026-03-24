import { useQuery } from "@tanstack/react-query";
import { fetchAllUsersForInvite } from "@/api/calendar";

/**
 * Fetches all users available for event invitations.
 * Used in CreateEventModal invitee selector.
 */
export const useUsersForInvite = () =>
  useQuery({
    queryKey: ["users-for-invite"],
    queryFn: fetchAllUsersForInvite,
  });
