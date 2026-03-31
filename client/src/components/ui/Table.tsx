import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSort?: () => void;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  isLoading?: boolean;
}

export const Table = <T,>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = "No data found",
  isLoading = false,
}: TableProps<T>) => {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-celery-600">
      <table className="w-full text-sm text-celery-300">
        <thead className="bg-celery-800 text-celery-500 uppercase text-xs tracking-wider">
          <tr>
            {columns.map((col) =>
              col.sortable ? (
                <th
                  key={col.key}
                  scope="col"
                  onClick={col.onSort}
                  className={cn("px-4 py-3 text-left cursor-pointer select-none", col.className)}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortField !== col.key ? (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    ) : col.sortDirection === "asc" ? (
                      <ArrowUp className="h-3 w-3 text-celery-400" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-celery-400" />
                    )}
                  </span>
                </th>
              ) : (
                <th key={col.key} scope="col" className={cn("px-4 py-3 text-left", col.className)}>
                  {col.header}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-celery-500">
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-celery-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => {
                  if (onRowClick) onRowClick(row);
                }}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? "row" : undefined}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === "Enter" || e.key === " ")) onRowClick(row);
                }}
                className={cn(
                  "border-t border-celery-800",
                  "hover:bg-celery-800",
                  onRowClick ? "cursor-pointer" : undefined,
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3", col.className)}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
