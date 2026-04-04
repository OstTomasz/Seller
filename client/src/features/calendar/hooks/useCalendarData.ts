import { useState, useCallback, useEffect } from "react";
import dayjs from "dayjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { transformEvents } from "../utils/eventTransformer";
import { useAuthStore } from "@/store/authStore";
import type { CalendarEvent, CalendarView, DragDropEventArgs } from "@/types";
import { fetchEvents, fetchAllInvitations, updateEventDate } from "@/api/calendar";

// Single source of truth for cache invalidation
export const CALENDAR_QUERY_KEY = "calendar-events";

interface UseCalendarDataReturn {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  currentView: CalendarView;
  currentDate: Date;
  onNavigate: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
  onEventDrop: (args: DragDropEventArgs) => void;
}

/**
 * Manages calendar data lifecycle: fetching, range windowing, and drag-drop mutations.
 */
export const useCalendarData = (): UseCalendarDataReturn => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<CalendarView>("month");

  useEffect(() => {
    const getView = (): CalendarView => {
      if (window.innerWidth < 768) return "agenda";
      return "month";
    };

    setCurrentView(getView());

    const handleResize = () => setCurrentView(getView());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getRange = useCallback(() => {
    const base = dayjs(currentDate);

    if (currentView === "week") {
      return {
        from: base.startOf("week").subtract(1, "day").toISOString(),
        to: base.endOf("week").add(1, "day").toISOString(),
      };
    }

    if (currentView === "agenda") {
      const base = dayjs(currentDate).startOf("month");
      return {
        from: base.toISOString(),
        to: base.endOf("month").toISOString(),
      };
    }

    // month
    return {
      from: base.startOf("month").subtract(7, "day").toISOString(),
      to: base.endOf("month").add(7, "day").toISOString(),
    };
  }, [currentDate, currentView]);

  const {
    data: events = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: [CALENDAR_QUERY_KEY, getRange()],
    queryFn: async () => {
      const [rawEvents, invitations] = await Promise.all([
        fetchEvents(getRange()),
        fetchAllInvitations(),
      ]);
      return transformEvents(rawEvents, invitations, user!._id);
    },
    enabled: !!user?._id,
    staleTime: 30 * 1000,
  });

  const { mutate: dropEvent } = useMutation({
    mutationFn: ({ event, start, end }: DragDropEventArgs) => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const duration = event.allDay ? null : dayjs(endDate).diff(dayjs(startDate), "minute");

      return updateEventDate(event.id, {
        startDate: dayjs(startDate).toISOString(),
        duration,
      });
    },
    // Optimistic update before API call
    onMutate: async ({ event, start, end }: DragDropEventArgs) => {
      const range = getRange();
      await queryClient.cancelQueries({ queryKey: [CALENDAR_QUERY_KEY, range] });

      const previous = queryClient.getQueryData<CalendarEvent[]>([CALENDAR_QUERY_KEY, range]);

      queryClient.setQueryData<CalendarEvent[]>([CALENDAR_QUERY_KEY, range], (old = []) =>
        old.map((e) =>
          e.id === event.id ? { ...e, start: new Date(start), end: new Date(end) } : e,
        ),
      );

      return { previous, range };
    },
    onError: (_err, _args, context) => {
      // Rollback on failure
      if (context?.previous) {
        queryClient.setQueryData([CALENDAR_QUERY_KEY, context.range], context.previous);
      }
      toast.error("Failed to update event date.");
    },
    onSettled: (_data, _err, _args, context) => {
      queryClient.invalidateQueries({ queryKey: [CALENDAR_QUERY_KEY, context?.range] });
    },
  });

  const onEventDrop = useCallback(
    (args: DragDropEventArgs) => {
      if (!args.event.resource.canDrag) return;
      dropEvent(args);
    },
    [dropEvent],
  );

  const onViewChange = useCallback(
    (view: CalendarView) => {
      setCurrentView(view);

      if (view === "agenda") {
        setCurrentDate(dayjs(currentDate).startOf("month").toDate());
      }
    },
    [currentDate],
  );

  const onNavigate = useCallback(
    (date: Date) => {
      if (currentView === "agenda") {
        const incoming = dayjs(date);
        const current = dayjs(currentDate).startOf("month");

        if (incoming.startOf("month").isSame(current)) {
          setCurrentDate(current.add(1, "month").toDate());
        } else {
          setCurrentDate(incoming.startOf("month").toDate());
        }
      } else {
        setCurrentDate(date);
      }
    },
    [currentView, currentDate],
  );

  return {
    events,
    isLoading,
    error: isError ? "Failed to fetch events." : null,
    currentView,
    currentDate,
    onNavigate,
    onViewChange,
    onEventDrop,
  };
};
