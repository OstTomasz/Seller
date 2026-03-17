import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs = ({ items, className }: BreadcrumbsProps) => (
  <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1.5 text-sm mb-6", className)}>
    {items.map((item, i) => {
      const isLast = i === items.length - 1;
      return (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 ? <ChevronRight className="h-3.5 w-3.5 text-celery-700 shrink-0" /> : null}
          {isLast || !item.to ? (
            <span className={cn(isLast ? "text-celery-300 font-medium" : "text-celery-600")}>
              {item.label}
            </span>
          ) : (
            <Link to={item.to} className="text-celery-600 hover:text-celery-400">
              {item.label}
            </Link>
          )}
        </span>
      );
    })}
  </nav>
);