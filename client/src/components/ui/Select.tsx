import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const errorId = `${selectId}-error`;
    return (
      <div className="flex flex-col">
        {label ? (
          <label
            htmlFor={selectId}
            className="text-sm text-celery-300 mb-1.5 block"
          >
            {label}
          </label>
        ) : null}
        <div className="relative">
          <select
            {...props}
            ref={ref}
            id={selectId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "w-full bg-celery-700 text-celery-100 border rounded-lg",
              "text-sm outline-none appearance-none",
              error
                ? "border-error focus:border-error"
                : "border-celery-600 focus:border-gold-500",
              className,
            )}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-celery-800"
              >
                {opt.label}
              </option>
            ))}
          </select>
          {/* custom arrow */}
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-celery-500 pointer-events-none"
          />
        </div>
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

Select.displayName = "Select";
