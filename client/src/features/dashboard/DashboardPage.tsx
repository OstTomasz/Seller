import { NotificationList } from "../notifications/NotificationsList";
import { CalendarPage } from "../calendar/CalendarPage";

export const DashboardPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-fluid-h1 font-bold text-celery-100">Dashboard</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold text-celery-500 uppercase tracking-wider">Calendar</h2>
        <div className="rounded-xl border border-celery-700 bg-bg-surface p-4">
          <CalendarPage />
        </div>
      </section>

      <NotificationList />
    </div>
  );
};
