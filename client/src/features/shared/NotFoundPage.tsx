// client/src/features/shared/NotFoundPage.tsx
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

/** 404 Not Found page — matches app design system. */
export const NotFoundPage = () => (
  <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-6 px-4">
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="text-8xl font-bold text-celery-700 select-none">404</span>
      <h1 className="text-2xl font-semibold text-celery-100">Page not found</h1>
      <p className="text-sm text-celery-500 max-w-xs">
        The page you're looking for doesn't exist or has been moved.
      </p>
    </div>
    <Link
      to="/"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-celery-700 hover:bg-celery-600 text-celery-100 text-sm font-medium transition-colors"
    >
      <Home className="h-4 w-4" />
      Go home
    </Link>
  </div>
);
