import { cn } from "@/lib/utils";

interface Props {
  icon: React.ElementType;
  onClick: () => void;
  title: string;
  variant?: "default" | "danger";
}

/** Reusable icon action button for management views */
export const ManagementActionBtn = ({ icon: Icon, onClick, title, variant = "default" }: Props) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    title={title}
    className={cn(
      "p-1 rounded transition-colors",
      variant === "danger"
        ? "text-celery-600 hover:text-red-400"
        : "text-celery-600 hover:text-celery-300",
    )}
  >
    <Icon className="size-3.5" />
  </button>
);
