import { useSearchParams } from "react-router-dom";
import { NotificationList } from "@/features/notifications/components/NotificationList";
import { CalendarPage } from "@/features/calendar/pages/CalendarPage";

export const DashboardPage = () => {
  const [searchParams] = useSearchParams();
  const expandNotifications = searchParams.get("expand") === "notifications";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-fluid-h1 font-bold text-celery-100">Dashboard</h1>
      <CalendarPage defaultExpanded={!expandNotifications} />
      <NotificationList defaultExpanded={expandNotifications} />
    </div>
  );
};
