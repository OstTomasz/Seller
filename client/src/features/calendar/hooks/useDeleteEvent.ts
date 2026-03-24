import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteEvent } from "@/api/calendar";
import { CALENDAR_QUERY_KEY } from "./useCalendarData";

/**
 * Mutation for deleting a calendar event.
 * Invalidates calendar cache on success.
 */
export const useDeleteEvent = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CALENDAR_QUERY_KEY] });
      toast.success("Event deleted.");
      onSuccess?.();
    },
    onError: () => {
      toast.error("Failed to delete event.");
    },
  });
};
