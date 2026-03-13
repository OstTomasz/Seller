import { cn } from "@/lib/utils";
import { ClientStatus } from "@/types";

type BadgeVariant = "active" | "warning" | "error" | "muted" | "gold";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  active: "bg-celery-800 text-celery-300 border border-celery-600",
  warning: "bg-amber-950 text-amber-400 border border-amber-800",
  error: "bg-red-950 text-red-400 border border-red-800",
  muted: "bg-celery-900 text-celery-500 border border-celery-800",
  gold: "bg-gold-900 text-gold-400 border border-gold-700",
};

export const Badge = ({
  variant = "muted",
  children,
  className,
}: BadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
};

// maps ClientStatus to Badge variant
export const statusVariantMap: Record<ClientStatus, BadgeVariant> = {
  active: "active",
  reminder: "warning",
  inactive: "error",
  archived: "muted",
};
