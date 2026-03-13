import { cn } from "@/lib/utils";

interface CardProps {
  elevated?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const Card = ({ elevated = false, className, style, children }: CardProps) => {
  return (
    <div
      style={style}
      className={cn(
        "rounded-lg p-6",
        elevated
          ? "bg-bg-elevated border border-gold-500"
          : "bg-bg-surface border border-celery-600",
        className,
      )}
    >
      {children}
    </div>
  );
};