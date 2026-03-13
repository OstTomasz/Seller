import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-celery-600 hover:bg-celery-500 text-celery-100 border border-gold-500 hover:border-gold-400",
  secondary:
    "bg-celery-800 hover:bg-celery-700 text-celery-300 border border-celery-600",
  ghost:
    "bg-transparent hover:bg-celery-800 text-celery-500 hover:text-celery-300",
  danger: "bg-red-950 hover:bg-red-900 text-red-400 border border-red-800",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export const Button = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) => {
  return (
    <button
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-label={isLoading ? "Loading..." : undefined}
      className={cn(
        // base
        "inline-flex items-center justify-center font-medium rounded-lg",
        "disabled:opacity-50 disabled:pointer-events-none",
        // variant & size
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
