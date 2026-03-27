import { NotificationList } from "../notifications/NotificationsList";
import { CalendarPage } from "../calendar/CalendarPage";

export const DashboardPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-fluid-h1 font-bold text-celery-100">Dashboard</h1>

      <CalendarPage />

      <NotificationList />
    </div>
  );
};
