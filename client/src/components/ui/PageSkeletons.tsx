import { Skeleton } from "./Skeleton";

export const ListPageSkeleton = () => {
  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-28" />
      </div>
      <Skeleton className="h-10 w-full max-w-xs" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={`list-row-${index}`} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
};

export const SettingsPageSkeleton = () => {
  return (
    <div className="flex flex-col max-w-3xl mx-auto gap-6">
      <Skeleton className="h-10 w-40" />
      <div className="flex items-center gap-6">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={`settings-card-${index}`} className="rounded-xl border border-celery-800 p-6">
          <Skeleton className="h-6 w-36 mb-4" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SplitCardsSkeleton = () => {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-celery-800 p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="rounded-xl border border-celery-800 p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={`split-row-${index}`} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
