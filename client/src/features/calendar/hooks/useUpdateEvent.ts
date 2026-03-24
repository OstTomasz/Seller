import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateEvent, type UpdateEventPayload } from "@/api/calendar";
import { CALENDAR_QUERY_KEY } from "./useCalendarData";

/**
 * Mutation for updating an existing calendar event.
 * Invalidates calendar cache on success.
 * Shows warning toast if backend detected scheduling conflicts.
 */
export const useUpdateEvent = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: UpdateEventPayload }) =>
      updateEvent(eventId, payload),
    onSuccess: ({ conflicts }) => {
      queryClient.invalidateQueries({ queryKey: [CALENDAR_QUERY_KEY] });

      if (conflicts.length > 0) {
        toast.warning(
          `Event updated, but conflicts with: ${conflicts.map((c) => c.title).join(", ")}`,
        );
      } else {
        toast.success("Event updated.");
      }

      onSuccess?.();
    },
    onError: () => {
      toast.error("Failed to update event.");
    },
  });
};
