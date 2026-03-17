import { Spinner } from "./Spinner";

export const Loader = ({ label }: { label: string }) => {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <span className="text-sm text-celery-500">Loading {label}...</span>
      </div>
    </div>
  );
};
