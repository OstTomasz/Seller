import dayjs from "dayjs";
import { useState } from "react";
import { AppCalendar } from "./AppCalendar";
import { EventDetailModal } from "./EventDetailModal";
import { CreateEventModal } from "./CreateEventModal";
import { EditEventModal } from "./EditEventModal";
import type { CalendarEvent, EventFormValues } from "@/types";

export const CalendarPage = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [slotStart, setSlotStart] = useState<Date | null>(null);
  const [copyValues, setCopyValues] = useState<Partial<EventFormValues> | null>(null);

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
        onSlotClick={({ start }) => setSlotStart(new Date(start))}
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
