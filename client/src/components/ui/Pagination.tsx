import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  rowsPerPage: number;
  rowsPerPageOptions?: readonly number[];
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

export const Pagination = ({
  page,
  totalPages,
  totalItems,
  rowsPerPage,
  rowsPerPageOptions = [10, 20],
  onPageChange,
  onRowsPerPageChange,
}: PaginationProps) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | "...")[]>((acc, p, i, arr) => {
      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  const from = totalItems === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const to = Math.min(page * rowsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-celery-500">
      {/* Rows per page */}
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        {rowsPerPageOptions.map((n) => (
          <button
            key={n}
            onClick={() => onRowsPerPageChange(n)}
            className={cn(
              "px-2 py-0.5 rounded text-xs border",
              rowsPerPage === n
                ? "bg-celery-700 border-celery-500 text-celery-100"
                : "border-celery-700 hover:border-celery-600 text-celery-500",
            )}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        <span className="text-xs mr-2">
          {totalItems === 0 ? "0" : `${from}–${to}`} of {totalItems}
        </span>
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-2 py-1 rounded border border-celery-700 hover:border-celery-600 disabled:opacity-30 disabled:pointer-events-none"
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={cn(
                "px-2 py-1 rounded border text-xs",
                page === p
                  ? "bg-celery-700 border-celery-500 text-celery-100"
                  : "border-celery-700 hover:border-celery-600 text-celery-500",
              )}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages || totalPages === 0}
          className="px-2 py-1 rounded border border-celery-700 hover:border-celery-600 disabled:opacity-30 disabled:pointer-events-none"
        >
          ›
        </button>
      </div>
    </div>
  );
};
