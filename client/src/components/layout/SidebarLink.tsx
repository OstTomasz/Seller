import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface SidebarLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  variant?: "sidebar" | "nav";
}

export const SidebarLink = ({
  to,
  icon: Icon,
  label,
  onClick,
  variant = "sidebar",
}: SidebarLinkProps) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center font-medium transition-colors duration-150",
          variant === "nav"
            ? cn(
                "gap-1.5 px-3 py-1.5 rounded-md text-sm",
                isActive
                  ? "text-celery-100 bg-celery-700"
                  : "text-celery-500 hover:text-celery-300 hover:bg-celery-800",
              )
            : cn(
                "gap-3 px-3 py-2.5 rounded-lg text-sm",
                isActive
                  ? "bg-celery-700 text-celery-100 border border-celery-600"
                  : "text-celery-500 hover:bg-celery-800 hover:text-celery-300",
              ),
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
};