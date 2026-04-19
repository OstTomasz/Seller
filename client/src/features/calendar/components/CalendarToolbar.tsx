import type { ToolbarProps } from "react-big-calendar";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types";
import { useEffect, useState } from "react";
import { Select } from "@/components/ui";

const MONTHS = [
  { value: "0", label: "January" },
  { value: "1", label: "February" },
  { value: "2", label: "March" },
  { value: "3", label: "April" },
  { value: "4", label: "May" },
  { value: "5", label: "June" },
  { value: "6", label: "July" },
  { value: "7", label: "August" },
  { value: "8", label: "September" },
  { value: "9", label: "October" },
  { value: "10", label: "November" },
  { value: "11", label: "December" },
];

const currentYear = new Date().getFullYear();

const YEARS = Array.from({ length: 5 }, (_, i) => {
  const year = (currentYear - 2 + i).toString();
  return {
    value: year,
    label: year,
  };
});

const VIEW_LABELS: Record<string, string> = {
  month: "Month",
  week: "Week",
  agenda: "Agenda",
};

export const CalendarToolbar = ({
  view,
  views,
  onView,
  onNavigate,
  date,
}: ToolbarProps<CalendarEvent>) => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const availableViews = (views as string[]).filter((v) => (isMobile ? v === "agenda" : true));

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(date);
    newDate.setMonth(parseInt(e.target.value));
    onNavigate("DATE", newDate);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(date);
    newDate.setFullYear(parseInt(e.target.value));
    onNavigate("DATE", newDate);
  };

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <button
        onClick={() => onNavigate("TODAY")}
        className="order-1 flex items-center gap-1.5 rounded-md border border-celery-700
                   px-3 py-1.5 text-sm font-medium text-celery-400
                   hover:bg-celery-800 hover:text-celery-200 transition-colors"
      >
        <CalendarDays className="size-4" />
        Today
      </button>

      <div className="order-2 md:order-3 flex overflow-hidden rounded-md border border-celery-700">
        {(availableViews as string[]).map((v) => (
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

      <div className="order-3 md:order-2 flex items-center gap-2 mx-auto">
        <button
          type="button"
          onClick={() => onNavigate("PREV")}
          className="rounded-md border border-celery-700 p-1.5 text-celery-400
                     hover:bg-celery-800 hover:text-celery-200 transition-colors"
          aria-label="Previous period"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="flex gap-1 pt-5">
          <Select
            options={MONTHS}
            value={date.getMonth().toString()}
            onChange={handleMonthChange}
            className="w-32 py-1 px-2"
          />
          <Select
            options={YEARS}
            value={date.getFullYear().toString()}
            onChange={handleYearChange}
            className="w-24 py-1 px-2"
          />
        </div>

        <button
          onClick={() => onNavigate("NEXT")}
          className="rounded-md border border-celery-700 p-1.5 text-celery-400
                     hover:bg-celery-800 hover:text-celery-200 transition-colors"
          aria-label="Next period"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
};
