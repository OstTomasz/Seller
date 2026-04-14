import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { FieldContainer } from "./FieldContainer";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  surface?: "default" | "elevated";
  hideErrorSpace?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, surface = "default", hideErrorSpace = false, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <FieldContainer id={inputId} label={label} error={error} hideErrorSpace={hideErrorSpace}>
        <input
          {...props}
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            "w-full bg-celery-700 text-celery-100 border rounded-lg",
            surface === "elevated" && "bg-bg-elevated",
            "text-sm outline-none",
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

Input.displayName = "Input";
