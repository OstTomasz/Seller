// client/src/features/dashboard/DashboardPage.tsx

import { CalendarDays } from "lucide-react";
import { NotificationList } from "../notifications/NotificationsList";

export const DashboardPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-fluid-h1 font-bold text-celery-100">Dashboard</h1>

      {/* Calendar placeholder */}
      <div className="rounded-lg border border-dashed border-celery-700 bg-bg-surface flex flex-col items-center justify-center gap-3 py-16">
        <CalendarDays className="h-8 w-8 text-celery-600" />
        <p className="text-sm text-celery-500">Calendar — coming soon</p>
      </div>

      <NotificationList />
    </div>
  );
};
