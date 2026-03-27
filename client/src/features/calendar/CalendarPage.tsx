// client/src/features/calendar/CalendarPage.tsx
import dayjs from "dayjs";
import { useState } from "react";
import { AppCalendar } from "./AppCalendar";
import { EventDetailModal } from "./EventDetailModal";
import { CreateEventModal } from "./CreateEventModal";
import { EditEventModal } from "./EditEventModal";
import { DayViewModal } from "./DayViewModal";
import { isPastDate } from "./utils/calendarUtils";
import type { CalendarEvent, EventFormValues } from "@/types";
import { useCalendarData } from "./hooks/useCalendarData";

export const CalendarPage = () => {
  const { events } = useCalendarData();

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [slotStart, setSlotStart] = useState<Date | null>(null);
  const [copyValues, setCopyValues] = useState<Partial<EventFormValues> | null>(null);

  // Events for the selected day — filter from cache
  const dayEvents = selectedDay
    ? events.filter(
        (e) =>
          dayjs(e.start).isSame(dayjs(selectedDay), "day") ||
          (e.allDay && dayjs(e.start).isSame(dayjs(selectedDay), "day")),
      )
    : [];

  const handleCopy = (event: CalendarEvent) => {
    const raw = event.resource.raw;
    setCopyValues({
      title: raw.title,
      type: raw.type,
      allDay: raw.allDay,
      duration: raw.duration ?? 60,
      location: raw.location ?? "",
      description: raw.description ?? "",
      startTime: raw.allDay ? "09:00" : dayjs(raw.startDate).format("HH:mm"),
    });
    setSelectedEvent(null);
  };

  return (
    <>
      <AppCalendar
        onEventClick={setSelectedEvent}
        onDayClick={setSelectedDay} // ← nowy prop
        onSlotClick={({ start }) => setSlotStart(new Date(start))}
      />

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
