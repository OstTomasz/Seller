// client/src/features/calendar/DayViewModal.tsx
import dayjs from "dayjs";
import { Plus, Clock, CalendarDays } from "lucide-react";
import { Modal, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { CalendarEvent, EventVariant } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

const HOUR_START = 8;
const HOUR_END = 20;

const variantBar: Record<EventVariant, string> = {
  own: "bg-celery-600",
  invited_accepted: "bg-gold-400",
  invited_pending: "bg-gold-700 border border-dashed border-gold-500",
  mandatory: "bg-red-700",
  team: "bg-celery-800 border border-celery-600",
};

const formatTime = (date: string, duration: number | null): string => {
  const start = dayjs(date).format("HH:mm");
  if (duration === null) return start;
  const end = dayjs(date).add(duration, "minute").format("HH:mm");
  return `${start} – ${end}`;
};

// ── Sub-components ────────────────────────────────────────────────────────────

const EventRow = ({
  event,
  onClick,
  outOfRange = false,
}: {
  event: CalendarEvent;
  onClick: (event: CalendarEvent) => void;
  outOfRange?: boolean;
}) => {
  const { raw, variant } = event.resource;

  return (
    <button
      type="button"
      onClick={() => onClick(event)}
      className={cn(
        "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left",
        "transition-colors hover:bg-celery-800",
        outOfRange && "opacity-60",
      )}
    >
      {/* Color bar */}
      <span className={cn("w-1 h-8 rounded-full shrink-0", variantBar[variant])} />

      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium text-celery-100 truncate">{raw.title}</span>
        <span className="text-xs text-celery-500 flex items-center gap-1">
          <Clock className="size-3" />
          {raw.allDay ? "All day" : formatTime(raw.startDate, raw.duration)}
          {raw.location ? ` · ${raw.location}` : ""}
        </span>
      </div>
    </button>
  );
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface DayViewModalProps {
  date: Date | null;
  events: CalendarEvent[];
  onClose: () => void;
  onEventClick: (event: CalendarEvent) => void;
  onAddEvent: (date: Date) => void;
  isPastDate: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const DayViewModal = ({
  date,
  events,
  onClose,
  onEventClick,
  onAddEvent,
  isPastDate,
}: DayViewModalProps) => {
  if (!date) return null;

  const dayStart = dayjs(date).startOf("day");

  // Split events: within 08-20 range vs outside
  const allDayEvents = events.filter((e) => e.resource.raw.allDay);

  const timedEvents = events.filter((e) => !e.resource.raw.allDay);

  const inRangeEvents = timedEvents.filter((e) => {
    const hour = dayjs(e.resource.raw.startDate).hour();
    return hour >= HOUR_START && hour < HOUR_END;
  });

  const outOfRangeEvents = timedEvents.filter((e) => {
    const hour = dayjs(e.resource.raw.startDate).hour();
    return hour < HOUR_START || hour >= HOUR_END;
  });

  // Sort by start time
  const sortByTime = (a: CalendarEvent, b: CalendarEvent) =>
    dayjs(a.resource.raw.startDate).diff(dayjs(b.resource.raw.startDate));

  const sortedInRange = [...inRangeEvents].sort(sortByTime);
  const sortedOutOfRange = [...outOfRangeEvents].sort(sortByTime);

  const handleEventClick = (event: CalendarEvent) => {
    onClose();
    onEventClick(event);
  };

  const title = dayStart.format("dddd, D MMMM YYYY");
  const isToday = dayStart.isSame(dayjs().startOf("day"));

  return (
    <Modal
      isOpen={date !== null}
      onClose={onClose}
      size="md"
      title={isToday ? `Today — ${dayStart.format("D MMMM")}` : title}
    >
      <div className="flex flex-col gap-4">
        {/* All day events */}
        {allDayEvents.length > 0 ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-celery-600 uppercase tracking-wider font-medium px-1">
              All day
            </span>
            {allDayEvents.map((event) => (
              <EventRow key={event.id} event={event} onClick={handleEventClick} />
            ))}
          </div>
        ) : null}

        {/* Timed events 08–20 */}
        {sortedInRange.length > 0 ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-celery-600 uppercase tracking-wider font-medium px-1">
              {HOUR_START}:00 – {HOUR_END}:00
            </span>
            {sortedInRange.map((event) => (
              <EventRow key={event.id} event={event} onClick={handleEventClick} />
            ))}
          </div>
        ) : null}

        {/* Out of range events */}
        {sortedOutOfRange.length > 0 ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-celery-600 uppercase tracking-wider font-medium px-1">
              Outside working hours
            </span>
            {sortedOutOfRange.map((event) => (
              <EventRow key={event.id} event={event} onClick={handleEventClick} outOfRange />
            ))}
          </div>
        ) : null}

        {/* Empty state */}
        {events.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-celery-600">
            <CalendarDays className="size-8 opacity-40" />
            <p className="text-sm">No events on this day.</p>
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex justify-between items-center pt-2 border-t border-celery-700">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {!isPastDate ? (
            <Button
              onClick={() => {
                onClose();
                onAddEvent(date);
              }}
            >
              <Plus className="size-4 mr-1.5" />
              Add event
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
};
