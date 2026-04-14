import { cn } from "@/lib/utils";

interface ArchiveReasonFieldsProps {
  clientName?: string;
  label: string;
  placeholder: string;
  error?: string;
  textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
}

const FieldError = ({ message }: { message?: string }) =>
  message ? <span className="min-h-4 text-xs text-red-400">{message}</span> : <span className="min-h-4" />;

export const ArchiveReasonFields = ({
  clientName,
  label,
  placeholder,
  error,
  textareaProps,
}: ArchiveReasonFieldsProps) => (
  <div className="flex flex-col gap-1">
    <div className="p-3 rounded-lg bg-bg-base border border-celery-700 mb-2">
      <span className="text-xs text-celery-600">Client</span>
      <p className="text-sm text-celery-200 font-medium">{clientName}</p>
    </div>
    <label className="text-xs text-celery-500">{label}</label>
    <textarea
      {...textareaProps}
      rows={3}
      placeholder={placeholder}
      className={cn(
        "w-full rounded-lg bg-bg-elevated border border-celery-700",
        "px-3 py-2 text-sm text-celery-200 resize-none",
        "focus:outline-none focus:border-celery-500",
      )}
    />
    <FieldError message={error} />
  </div>
);
