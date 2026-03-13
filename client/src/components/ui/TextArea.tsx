import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const errorId = `${textareaId}-error`;

    return (
      <div className="flex flex-col">
        {label ? (
          <label
            htmlFor={textareaId}
            className="text-sm text-celery-300 mb-1.5 block"
          >
            {label}
          </label>
        ) : null}
        <textarea
          {...props}
          ref={ref}
          id={textareaId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "w-full bg-celery-700 text-celery-100 border rounded-lg",
            "text-sm outline-none resize-none",
            "placeholder:text-celery-500",
            error
              ? "border-error focus:border-error"
              : "border-celery-600 focus:border-gold-500",
            className,
          )}
        />
        <span
          id={errorId}
          role="alert"
          className="text-xs text-error min-h-4 mt-1"
        >
          {error ? error : null}
        </span>
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
