import React, { useCallback } from "react";
import { Calendar, type View } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import dayjs from "dayjs";

import { localizer } from "../lib/calendarSetup";
import { useCalendarData } from "../hooks/useCalendarData";
import { useUpdateEvent } from "../hooks/useUpdateEvent";
import { CalendarEventTile } from "./CalendarEventTile";
import { CalendarToolbar } from "./CalendarToolbar";
import { cn } from "@/lib/utils";
import { isPastDate } from "../utils/calendarUtils";
import type { CalendarEvent, CalendarView } from "@/types";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "../styles/calendar-overrides.css";

const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar);

interface AppCalendarProps {
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (slotInfo: { start: Date; end: Date; action: string }) => void;
  onDayClick: (date: Date) => void;
}

interface DateCellWrapperProps {
  children: React.ReactNode;
  value: Date;
}

interface StyleElementProps {
  style?: React.CSSProperties;
}

export const AppCalendar = ({ onEventClick, onSlotClick, onDayClick }: AppCalendarProps) => {
  const { events, isLoading, error, currentView, currentDate, onNavigate, onViewChange } =
    useCalendarData();
  const { mutate: updateEvent } = useUpdateEvent();

  const handleEventDrop = useCallback(
    ({ event, start, end }: { event: CalendarEvent; start: Date | string; end: Date | string }) => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const allDay = event.resource.raw.allDay;
      const duration = allDay
        ? null
        : Math.round((endDate.getTime() - startDate.getTime()) / 60000);

      updateEvent({
        eventId: event.resource.raw._id,
        payload: { startDate: startDate.toISOString(), duration, allDay },
      });
    },
    [updateEvent],
  );

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
          "h-[400px] md:h-[750px]",
          isLoading && "pointer-events-none opacity-50",
        )}
      >
        <DnDCalendar
          localizer={localizer}
          events={events}
          view={currentView as View}
          date={currentDate}
          onView={(v) => onViewChange(v as CalendarView)}
          onNavigate={onNavigate}
          drilldownView={null}
          onDrillDown={onDayClick}
          onSelectEvent={onEventClick}
          onSelectSlot={(slotInfo) => {
            if (isPastDate(new Date(slotInfo.start))) return;
            if (slotInfo.action === "click") {
              onDayClick(new Date(slotInfo.start));
              return;
            }
            onSlotClick(slotInfo);
          }}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventDrop}
          draggableAccessor={draggableAccessor}
          dayPropGetter={dayPropGetter}
          slotPropGetter={slotPropGetter}
          eventPropGetter={(event: CalendarEvent) => ({
            className: currentView === "month" ? "rbc-event-dot-mode" : undefined,
            style:
              currentView !== "month"
                ? { cursor: isPastDate(new Date(event.start)) ? "default" : "pointer" }
                : undefined,
          })}
          selectable
          popup={false}
          onShowMore={(_events, date) => onDayClick(date)}
          components={{
            event: CalendarEventTile,
            toolbar: CalendarToolbar,
            dateCellWrapper: ({ children, value }: DateCellWrapperProps) => {
              const isPast = dayjs(value).isBefore(dayjs().startOf("day"));
              if (!React.isValidElement(children)) return <>{children}</>;
              const typedChildren = children as React.ReactElement<StyleElementProps>;
              return React.cloneElement(typedChildren, {
                style: {
                  ...(typedChildren.props.style ?? {}),
                  cursor: isPast ? "not-allowed" : "pointer",
                },
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
          scrollToTime={new Date(0, 0, 0, 8, 0)}
          style={{ height: "100%" }}
        />
      </div>
    </div>
  );
};
