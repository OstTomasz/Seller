import dayjs from "dayjs";
import { useState } from "react";
import { AppCalendar } from "../components/AppCalendar";
import { EventDetailModal } from "../components/EventDetailModal";
import { CreateEventModal } from "../components/CreateEventModal";
import { EditEventModal } from "../components/EditEventModal";
import { DayViewModal } from "../components/DayViewModal";
import { isPastDate } from "../utils/calendarUtils";
import type { CalendarEvent, EventFormValues } from "@/types";
import { useCalendarData } from "../hooks/useCalendarData";
import { useEventInvitations } from "../hooks/useEventInvitations";

import { Calendar as CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

interface CalendarPageProps {
  defaultExpanded?: boolean;
}

export const CalendarPage = ({ defaultExpanded = true }: CalendarPageProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const { events } = useCalendarData();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const { data: selectedEventInvitations = [] } = useEventInvitations(
    selectedEvent?.resource.raw._id ?? null,
  );
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [slotStart, setSlotStart] = useState<Date | null>(null);
  const [copyValues, setCopyValues] = useState<Partial<EventFormValues> | null>(null);

  const { user } = useAuthStore();

  const dayEvents = selectedDay
    ? events.filter(
        (e) =>
          dayjs(e.start).isSame(dayjs(selectedDay), "day") ||
          (e.allDay && dayjs(e.start).isSame(dayjs(selectedDay), "day")),
      )
    : [];

  const handleCopy = (event: CalendarEvent) => {
    const inviteeIds = selectedEventInvitations
      .map((inv) => (typeof inv.inviteeId === "object" ? inv.inviteeId._id : inv.inviteeId))
      .filter((id): id is string => Boolean(id) && id !== user?._id);

    const snapshot = {
      title: event.resource.raw.title,
      type: event.resource.raw.type,
      location: event.resource.raw.location ?? undefined,
      description: event.resource.raw.description ?? undefined,
      allDay: event.resource.raw.allDay,
      duration: event.resource.raw.duration ?? undefined,
      inviteeIds,
    } satisfies Partial<EventFormValues>;

    setSelectedEvent(null);
    setCopyValues(snapshot);
  };

  return (
    <>
      <div className="flex flex-col gap-4 max-w-6xl mx-auto w-full rounded-lg border border-celery-600 bg-bg-surface overflow-hidden transition-all duration-300">
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-celery-900/40",
            isExpanded ? "bg-celery-900/20" : "",
          )}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-celery-500" />
            <span className="text-sm font-medium text-celery-200 tracking-wider">Calendar</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-celery-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-celery-500" />
          )}
        </button>

        {isExpanded && (
          <div className="border-t border-celery-800 p-4 animate-in fade-in zoom-in-95 duration-200">
            <AppCalendar
              onEventClick={setSelectedEvent}
              onDayClick={setSelectedDay}
              onSlotClick={({ start }) => setSlotStart(new Date(start))}
            />
          </div>
        )}
      </div>

      <DayViewModal
        date={selectedDay}
        events={dayEvents}
        onClose={() => setSelectedDay(null)}
        onEventClick={setSelectedEvent}
        onAddEvent={(date) => setSlotStart(date)}
        isPastDate={selectedDay ? isPastDate(selectedDay) : false}
      />

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={(event) => {
          setSelectedEvent(null);
          setEditingEvent(event);
        }}
        onCopy={handleCopy}
      />

      <EditEventModal event={editingEvent} onClose={() => setEditingEvent(null)} />

      <CreateEventModal
        isOpen={slotStart !== null || copyValues !== null}
        onClose={() => {
          setSlotStart(null);
          setCopyValues(null);
        }}
        prefillStart={slotStart ?? undefined}
        prefillValues={copyValues ?? undefined}
      />
    </>
  );
};
