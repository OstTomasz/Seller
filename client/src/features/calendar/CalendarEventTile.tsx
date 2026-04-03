// client/src/features/calendar/CalendarEventTile.tsx
import type { EventProps } from "react-big-calendar";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent, EventVariant } from "@/types";
import { isPastEvent } from "./utils/calendarUtils";

const variantStyles: Record<EventVariant, string> = {
  own: "bg-celery-600 text-white",
  invited_accepted: "bg-gold-400 text-gold-900",
  invited_pending: "bg-gold-900 text-gold-300 border border-dashed border-gold-700",
  invited_rejected: "bg-red-900 text-red-300 border border-dashed border-red-700",
  mandatory: "bg-red-700 text-white",
  team: "bg-celery-800 text-celery-200 border border-celery-600",
};

export const CalendarEventTile = ({ event }: EventProps<CalendarEvent>) => {
  const { variant, raw } = event.resource;
  const isPast = isPastEvent(raw.startDate);

  return (
    <div
      className={cn(
        "flex items-center gap-1 truncate rounded px-1 py-0.5 text-xs font-medium w-full",
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
