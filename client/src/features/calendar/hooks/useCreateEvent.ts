import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createEvent, type CreateEventPayload } from "@/api/calendar";
import { CALENDAR_QUERY_KEY } from "./useCalendarData";

/**
 * Mutation for creating a new calendar event.
 * Invalidates calendar cache on success.
 * Shows warning toast if backend detected scheduling conflicts.
 */
export const useCreateEvent = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEventPayload) => createEvent(payload),
    onSuccess: ({ conflicts }) => {
      queryClient.invalidateQueries({ queryKey: [CALENDAR_QUERY_KEY] });

      if (conflicts.length > 0) {
        toast.warning(
          `Event created, but conflicts with: ${conflicts.map((c) => c.title).join(", ")}`,
        );
      } else {
        toast.success("Event created.");
      }

      onSuccess?.();
    },
    onError: () => {
      toast.error("Failed to create event.");
    },
  });
};
