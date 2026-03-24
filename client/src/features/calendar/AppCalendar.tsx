// client/src/features/calendar/AppCalendar.tsx
import React, { useCallback } from "react";
import { Calendar, type View } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import dayjs from "dayjs";

import { localizer } from "./lib/calendarSetup";
import { useCalendarData } from "./hooks/useCalendarData";
import { CalendarEventTile } from "./CalendarEventTile";
import { CalendarToolbar } from "./CalendarToolbar";
import { cn } from "@/lib/utils";
import { isPastDate } from "./utils/calendarUtils";
import type { CalendarEvent, CalendarView } from "@/types";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "./styles/calendar-overrides.css";

const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar);

interface AppCalendarProps {
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (slotInfo: { start: Date; end: Date; action: string }) => void;
}

export const AppCalendar = ({ onEventClick, onSlotClick }: AppCalendarProps) => {
  const {
    events,
    isLoading,
    error,
    currentView,
    currentDate,
    onNavigate,
    onViewChange,
    onEventDrop,
  } = useCalendarData();

  const draggableAccessor = useCallback((event: CalendarEvent) => event.resource.canDrag, []);

  // Month view: past day cells
  const dayPropGetter = useCallback((date: Date) => {
    const isPast = dayjs(date).isBefore(dayjs().startOf("day"));
    return {
      "data-past": isPast ? "true" : undefined,
      style: { cursor: isPast ? "not-allowed" : "pointer" },
    } as React.HTMLAttributes<HTMLDivElement>;
  }, []);

  // Week view: past time slots
  const slotPropGetter = useCallback((date: Date) => {
    const isPast = dayjs(date).isBefore(dayjs());
    return {
      style: { cursor: isPast ? "not-allowed" : "pointer" },
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="min-h-5">
        {error !== null ? <p className="text-sm text-red-500">{error}</p> : null}
      </div>

      <div
        className={cn(
          "transition-opacity duration-200",
          isLoading && "pointer-events-none opacity-50",
        )}
        style={{ height: 480 }}
      >
        <DnDCalendar
          localizer={localizer}
          events={events}
          view={currentView as View}
          date={currentDate}
          onView={(v) => onViewChange(v as CalendarView)}
          onNavigate={onNavigate}
          onSelectEvent={onEventClick}
          onSelectSlot={(slotInfo) => {
            if (isPastDate(new Date(slotInfo.start))) return;
            onSlotClick(slotInfo);
          }}
          onEventDrop={onEventDrop}
          onEventResize={onEventDrop}
          draggableAccessor={draggableAccessor}
          dayPropGetter={dayPropGetter}
          slotPropGetter={slotPropGetter}
          eventPropGetter={(event: CalendarEvent) => ({
            style: {
              cursor: isPastDate(new Date(event.start)) ? "default" : "pointer",
            },
          })}
          selectable
          popup
          components={{
            event: CalendarEventTile,
            toolbar: CalendarToolbar,
            dateCellWrapper: ({ children, value }: { children: React.ReactNode; value: Date }) => {
              const isPast = dayjs(value).isBefore(dayjs().startOf("day"));
              if (!React.isValidElement(children)) return <>{children}</>;
              return React.cloneElement(children as React.ReactElement<any>, {
                style: {
                  ...(children.props as any).style,
                  cursor: isPast ? "not-allowed" : "pointer",
                },
                "data-past": isPast ? "true" : undefined,
              });
            },
          }}
          views={["month", "week", "agenda"]}
          messages={{
            today: "Today",
            previous: "Previous",
            next: "Next",
            month: "Month",
            week: "Week",
            agenda: "Agenda",
            noEventsInRange: "No events in this period.",
            showMore: (count) => `+${count} more`,
            allDay: "All day",
            date: "Date",
            time: "Time",
            event: "Event",
          }}
          formats={{
            timeGutterFormat: "HH:mm",
            eventTimeRangeFormat: ({ start, end }) =>
              `${dayjs(start).format("HH:mm")} – ${dayjs(end).format("HH:mm")}`,
            agendaTimeRangeFormat: ({ start, end }) =>
              `${dayjs(start).format("HH:mm")} – ${dayjs(end).format("HH:mm")}`,
          }}
          min={new Date(0, 0, 0, 8, 0)}
          max={new Date(0, 0, 0, 20, 0)}
          style={{ height: "100%" }}
        />
      </div>
    </div>
  );
};
