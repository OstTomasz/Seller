// client/src/features/calendar/CalendarToolbar.tsx
import type { ToolbarProps } from "react-big-calendar";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types";

const VIEW_LABELS: Record<string, string> = {
  month: "Month",
  week: "Week",
  agenda: "Agenda",
};

export const CalendarToolbar = ({
  label,
  view,
  views,
  onView,
  onNavigate,
}: ToolbarProps<CalendarEvent>) => {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      {/* Today — left */}
      <button
        onClick={() => onNavigate("TODAY")}
        className="flex items-center gap-1.5 rounded-md border border-celery-700
                   px-3 py-1.5 text-sm font-medium text-celery-400
                   hover:bg-celery-800 hover:text-celery-200 transition-colors"
      >
        <CalendarDays className="size-4" />
        Today
      </button>

      {/* Label + arrows — center */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate("PREV")}
          className="rounded-md border border-celery-700 p-1.5 text-celery-400
                     hover:bg-celery-800 hover:text-celery-200 transition-colors"
          aria-label="Previous period"
        >
          <ChevronLeft className="size-4" />
        </button>

        <span className="min-w-36 text-center text-sm font-semibold text-celery-200 capitalize">
          {label}
        </span>

        <button
          onClick={() => onNavigate("NEXT")}
          className="rounded-md border border-celery-700 p-1.5 text-celery-400
                     hover:bg-celery-800 hover:text-celery-200 transition-colors"
          aria-label="Next period"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* View switcher — right */}
      <div className="flex overflow-hidden rounded-md border border-celery-700">
        {(views as string[]).map((v) => (
          <button
            key={v}
            onClick={() => onView(v as typeof view)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium transition-colors",
              view === v
                ? "bg-celery-600 text-white"
                : "text-celery-400 hover:bg-celery-800 hover:text-celery-200",
            )}
          >
            {VIEW_LABELS[v] ?? v}
          </button>
        ))}
      </div>
    </div>
  );
};
