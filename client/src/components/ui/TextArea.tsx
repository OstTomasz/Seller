import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { FieldContainer } from "./FieldContainer";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  surface?: "default" | "elevated";
  hideErrorSpace?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, surface = "default", hideErrorSpace = false, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <FieldContainer id={textareaId} label={label} error={error} hideErrorSpace={hideErrorSpace}>
        <textarea
          {...props}
          ref={ref}
          id={textareaId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          className={cn(
            "w-full bg-celery-700 text-celery-100 border rounded-lg",
            surface === "elevated" && "bg-bg-elevated",
            "text-sm outline-none resize-none",
            "placeholder:text-celery-500",
            error
              ? "border-error focus:border-error"
              : "border-celery-600 focus:border-gold-500",
            className,
          )}
        />
      </FieldContainer>
    );
  },
);

Textarea.displayName = "Textarea";
