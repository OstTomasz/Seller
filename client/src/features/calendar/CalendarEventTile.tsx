// client/src/features/calendar/CalendarEventTile.tsx
import type { EventProps } from "react-big-calendar";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent, EventVariant } from "@/types";
import { isPastEvent } from "./utils/calendarUtils";

const variantStyles: Record<EventVariant, string> = {
  own: "bg-celery-600 text-white border-celery-700",
  invited_accepted: "bg-gold-400 text-gold-900 border-gold-500",
  invited_pending: "bg-gold-900 text-gold-300 border-gold-700 border-dashed",
  mandatory: "bg-red-700 text-white border-red-800",
  team: "bg-celery-800 text-celery-200 border-celery-700",
};

export const CalendarEventTile = ({ event }: EventProps<CalendarEvent>) => {
  const { variant, raw } = event.resource;
  const isPast = isPastEvent(raw.startDate);

  return (
    <div
      className={cn(
        "flex items-center gap-1 truncate rounded px-1 py-0.5 text-xs font-medium border-l-2 transition-opacity",
        variantStyles[variant],
        isPast ? "opacity-40 cursor-default" : "cursor-pointer",
      )}
      title={`${event.title}${raw.location ? ` · ${raw.location}` : ""}`}
    >
      {raw.mandatory ? <AlertTriangle className="size-3 shrink-0" /> : null}
      <span className="truncate">{event.title}</span>
    </div>
  );
};
