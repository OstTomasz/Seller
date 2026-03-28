import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { respondToInvitation } from "@/api/calendar";
import { CALENDAR_QUERY_KEY } from "./useCalendarData";

/**
 * Mutation for responding to a calendar event invitation.
 * Invalidates calendar cache on success so the event tile updates immediately.
 */
export const useRespondToInvitation = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: "accepted" | "rejected" }) =>
      respondToInvitation(eventId, status),
    onSuccess: (_data, { eventId, status }) => {
      queryClient.invalidateQueries({ queryKey: [CALENDAR_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["event-invitations", eventId] }); // ✅
      toast.success(status === "accepted" ? "Invitation accepted." : "Invitation declined.");
      onSuccess?.();
    },
    onError: () => {
      toast.error("Failed to respond to invitation.");
    },
  });
};
