import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface SortableHeaderProps {
  label: string;
  field: string;
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
  className?: string;
}

export const SortableHeader = ({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
  className,
}: SortableHeaderProps) => (
  <th
    className={`px-4 py-3 text-left cursor-pointer select-none ${className ?? ""}`}
    onClick={() => onSort(field)}
  >
    <span className="flex items-center gap-1">
      {label}{" "}
      {sortField !== field ? (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      ) : sortDirection === "asc" ? (
        <ArrowUp className="h-3 w-3 text-celery-400" />
      ) : (
        <ArrowDown className="h-3 w-3 text-celery-400" />
      )}
    </span>
  </th>
);
