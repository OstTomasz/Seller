import { useMemo } from "react";
import { Client } from "@/types";
import { cn } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Dropdown } from "@/components/ui";

type SortField = "companyName" | "lastActivityAt" | "_id";
type SortDirection = "asc" | "desc";

const formatDate = (date: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const SortIcon = ({
  field,
  sortField,
  sortDirection,
}: {
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
}) => {
  if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return sortDirection === "asc" ? (
    <ArrowUp className="h-3 w-3 text-celery-400" />
  ) : (
    <ArrowDown className="h-3 w-3 text-celery-400" />
  );
};

const ROWS_PER_PAGE_OPTIONS = [10, 20] as const;

interface ArchiveClientsTableProps {
  clients: Client[];
  onUnarchive: (client: Client) => void;
}

export const ArchiveClientsTable = ({ clients, onUnarchive }: ArchiveClientsTableProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const salespersonFilter = searchParams.get("salesperson") ?? "";
  const sortField = (searchParams.get("sort") ?? "companyName") as SortField;
  const sortDirection = (searchParams.get("dir") ?? "asc") as SortDirection;
  const page = Number(searchParams.get("page") ?? "1");
  const rowsPerPage = Number(searchParams.get("rows") ?? "10") as 10 | 20;

  const setParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.set("page", "1");
      return next;
    });
  };

  const setPage = (p: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(p));
      return next;
    });
  };

  const setRowsPerPage = (n: 10 | 20) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("rows", String(n));
      next.set("page", "1");
      return next;
    });
  };

  const handleSort = (field: SortField) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (sortField === field) {
        next.set("dir", sortDirection === "asc" ? "desc" : "asc");
      } else {
        next.set("sort", field);
        next.set("dir", "asc");
      }
      next.set("page", "1");
      return next;
    });
  };

  const uniqueSalespersons = useMemo(() => {
    const names = clients.map((c) =>
      c.assignedTo?.currentHolder
        ? `${c.assignedTo.currentHolder.firstName} ${c.assignedTo.currentHolder.lastName}`
        : "—",
    );
    return [...new Set(names)];
  }, [clients]);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const city = c.addresses?.[0]?.city ?? "";
      const salesperson = c.assignedTo?.currentHolder
        ? `${c.assignedTo.currentHolder.firstName} ${c.assignedTo.currentHolder.lastName}`
        : "";

      const matchesSearch =
        !search ||
        c.companyName.toLowerCase().includes(search.toLowerCase()) ||
        (c.nip ?? "").includes(search) ||
        city.toLowerCase().includes(search.toLowerCase());

      const matchesSalesperson = !salespersonFilter || salesperson === salespersonFilter;

      return matchesSearch && matchesSalesperson;
    });
  }, [clients, search, salespersonFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      if (sortField === "companyName") {
        aVal = a.companyName.toLowerCase();
        bVal = b.companyName.toLowerCase();
      } else if (sortField === "lastActivityAt") {
        aVal = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
        bVal = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
      } else if (sortField === "_id") {
        aVal = a.numericId;
        bVal = b.numericId;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDirection]);

  const totalPages = Math.ceil(sorted.length / rowsPerPage);
  const paginated = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name, NIP, city..."
          value={search}
          onChange={(e) => setParam("search", e.target.value)}
          className="bg-bg-surface border border-celery-700 text-celery-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500 placeholder:text-celery-600 w-full sm:w-64"
        />
        <select
          value={salespersonFilter}
          onChange={(e) => setParam("salesperson", e.target.value)}
          className="bg-bg-surface border border-celery-700 text-celery-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500"
        >
          <option value="">All salespersons</option>
          {uniqueSalespersons.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-lg border border-celery-700">
        <table className="w-full text-sm text-celery-300">
          <thead className="bg-celery-800 text-celery-500 uppercase text-xs tracking-wider">
            <tr>
              <th
                className="px-4 py-3 text-left cursor-pointer select-none"
                onClick={() => handleSort("_id")}
              >
                <span className="flex items-center gap-1">
                  ID <SortIcon field="_id" sortField={sortField} sortDirection={sortDirection} />
                </span>
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer select-none"
                onClick={() => handleSort("companyName")}
              >
                <span className="flex items-center gap-1">
                  Company{" "}
                  <SortIcon
                    field="companyName"
                    sortField={sortField}
                    sortDirection={sortDirection}
                  />
                </span>
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer select-none"
                onClick={() => handleSort("lastActivityAt")}
              >
                <span className="flex items-center gap-1">
                  Last activity{" "}
                  <SortIcon
                    field="lastActivityAt"
                    sortField={sortField}
                    sortDirection={sortDirection}
                  />
                </span>
              </th>
              <th className="px-4 py-3 text-left">City</th>
              <th className="px-4 py-3 text-left">Salesperson</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-celery-600">
                  No archived clients found
                </td>
              </tr>
            ) : (
              paginated.map((client) => {
                const city = client.addresses?.[0]?.city ?? "—";
                const salesperson = client.assignedTo?.currentHolder
                  ? `${client.assignedTo.currentHolder.firstName} ${client.assignedTo.currentHolder.lastName}`
                  : "—";

                return (
                  <tr
                    key={client._id}
                    className="border-t border-celery-800 hover:bg-celery-800/50"
                  >
                    <td className="px-4 py-3 text-celery-600 font-mono text-xs">
                      {client.numericId}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          navigate(`/clients/${client._id}`, {
                            state: { clientsSearch: location.search },
                          })
                        }
                        className="text-celery-200 hover:text-celery-100 font-medium text-left"
                      >
                        {client.companyName}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-celery-400">
                      {formatDate(client.lastActivityAt)}
                    </td>
                    <td className="px-4 py-3">{city}</td>
                    <td className="px-4 py-3">{salesperson}</td>
                    <td className="px-4 py-3">
                      <Dropdown
                        trigger={
                          <button
                            type="button"
                            className="px-3 py-1 rounded-md text-xs font-medium bg-celery-800 hover:bg-celery-700 text-celery-300 border border-celery-600"
                          >
                            Actions
                          </button>
                        }
                        items={[
                          {
                            label: "Unarchive",
                            onClick: () => onUnarchive(client),
                            variant: "default",
                          },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-celery-500">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          {ROWS_PER_PAGE_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setRowsPerPage(n)}
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
        <div className="flex items-center gap-1">
          <span className="text-xs mr-2">
            {sorted.length === 0
              ? "0"
              : `${(page - 1) * rowsPerPage + 1}–${Math.min(page * rowsPerPage, sorted.length)}`}{" "}
            of {sorted.length}
          </span>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-2 py-1 rounded border border-celery-700 hover:border-celery-600 disabled:opacity-30 disabled:pointer-events-none"
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | "...")[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-2">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
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
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="px-2 py-1 rounded border border-celery-700 hover:border-celery-600 disabled:opacity-30 disabled:pointer-events-none"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
};
