import { useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { Client, UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Dropdown } from "@/components/ui";

type SortField = "companyName" | "lastActivityAt" | "_id";
type SortDirection = "asc" | "desc";

interface ClientsTableProps {
  clients: Client[];
  onRequestArchive: (client: Client) => void;
  onDirectArchive: (client: Client) => void;
}
//v2
// const STATUS_LABELS: Record<string, string> = {
//   active: "Active",
//   reminder: "Reminder",
//   inactive: "Inactive",
//   archived: "Archived",
// };

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

export const ClientsTable = ({ clients, onRequestArchive, onDirectArchive }: ClientsTableProps) => {
  const { user } = useAuthStore();
  const role = user?.role as UserRole;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") ?? "";
  // const statusFilter = searchParams.get("status") ?? ""; v2
  const regionFilter = searchParams.get("region") ?? "";
  const superregionFilter = searchParams.get("superregion") ?? "";
  const salespersonFilter = searchParams.get("salesperson") ?? "";
  const sortField = (searchParams.get("sort") ?? "lastActivityAt") as SortField;
  const sortDirection = (searchParams.get("dir") ?? "asc") as SortDirection;
  const page = Number(searchParams.get("page") ?? "1");
  const rowsPerPage = Number(searchParams.get("rows") ?? "10") as 10 | 20;

  /**
   * Updates a single URL param, resets page to 1.
   * Deletes the param if value is empty.
   */
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

  const getActionItems = (
    client: Client,
    role: UserRole,
    onRequestArchive: (client: Client) => void,
    onDirectArchive: (client: Client) => void,
  ): {
    label: string;
    onClick: () => void;
    variant?: "default" | "danger";
    disabled?: boolean;
  }[] => {
    if (role === "salesperson") {
      return [
        {
          label: "Request archive",
          onClick: () => onRequestArchive(client),
          variant: "danger",
          disabled: client.status === "archived" || !!client.archiveRequest?.requestedAt,
        },
      ];
    }

    if (role === "advisor") {
      return [{ label: "No actions available", onClick: () => {}, disabled: true }];
    }

    if (role === "deputy" || role === "director") {
      return [
        {
          label: "Archive",
          onClick: () => onDirectArchive(client),
          variant: "danger",
          disabled: client.status === "archived",
        },
      ];
    }

    return [];
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

  //v2
  // const uniqueStatuses = useMemo(() => [...new Set(clients.map((c) => c.status))], [clients]);

  const uniqueSalespersons = useMemo(() => {
    const names = clients.map((c) =>
      c.assignedTo?.currentHolder
        ? `${c.assignedTo.currentHolder.firstName} ${c.assignedTo.currentHolder.lastName}`
        : "—",
    );
    return [...new Set(names)];
  }, [clients]);

  const uniqueRegions = useMemo(() => {
    const regions = clients.map((c) => c.assignedTo?.region?.name ?? "—");
    return [...new Set(regions)];
  }, [clients]);

  const uniqueSuperregions = useMemo(() => {
    const superregions = clients.map((c) => c.assignedTo?.region?.parentRegion?.name ?? "—");
    return [...new Set(superregions)];
  }, [clients]);

  // ── Filtrowanie ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const city = c.addresses?.[0]?.city ?? "";
      const salesperson = c.assignedTo?.currentHolder
        ? `${c.assignedTo.currentHolder.firstName} ${c.assignedTo.currentHolder.lastName}`
        : "";
      const region = c.assignedTo?.region?.name ?? "";
      const superregion = c.assignedTo?.region?.parentRegion?.name ?? "";

      const matchesSearch =
        !search ||
        c.companyName.toLowerCase().includes(search.toLowerCase()) ||
        (c.nip ?? "").includes(search) ||
        city.toLowerCase().includes(search.toLowerCase());

      //v2
      // const matchesStatus = !statusFilter || c.status === statusFilter;
      const matchesSalesperson = !salespersonFilter || salesperson === salespersonFilter;
      const matchesRegion = !regionFilter || region === regionFilter;
      const matchesSuperregion = !superregionFilter || superregion === superregionFilter;

      return (
        matchesSearch && matchesSalesperson && matchesRegion && matchesSuperregion
        //&& matchesStatus v2
      );
    });
  }, [
    clients,
    search,
    salespersonFilter,
    regionFilter,
    superregionFilter,
    //statusFilter, v2
  ]);

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

  const showSalesperson = role === "advisor" || role === "deputy" || role === "director";
  const showRegion = role === "deputy" || role === "director";
  const showSuperregion = role === "director";

  return (
    <div className="flex flex-col gap-4">
      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name, NIP, city..."
          value={search}
          onChange={(e) => setParam("search", e.target.value)}
          className="bg-bg-surface border border-celery-700 text-celery-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500 placeholder:text-celery-600 w-full sm:w-64"
        />
        {/* v2
        <select
          value={statusFilter}
          onChange={(e) => setParam("status", e.target.value)}
          className="bg-bg-surface border border-celery-700 text-celery-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500"
        >
          <option value="">All statuses</option>
          {uniqueStatuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s] ?? s}
            </option>
          ))}
        </select> */}

        {showSuperregion ? (
          <select
            value={superregionFilter}
            onChange={(e) => {
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set("superregion", e.target.value);
                next.delete("region");
                next.delete("salesperson");
                next.set("page", "1");
                return next;
              });
            }}
            className="bg-bg-surface border border-celery-700 text-celery-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500"
          >
            <option value="">All superregions</option>
            {uniqueSuperregions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : null}

        {showRegion ? (
          <select
            value={regionFilter}
            onChange={(e) => {
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set("region", e.target.value);
                next.delete("superregion");
                next.delete("salesperson");
                next.set("page", "1");
                return next;
              });
            }}
            className="bg-bg-surface border border-celery-700 text-celery-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500"
          >
            <option value="">All regions</option>
            {uniqueRegions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        ) : null}

        {showSalesperson ? (
          <select
            value={salespersonFilter}
            onChange={(e) => {
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set("salesperson", e.target.value);
                next.delete("region");
                next.delete("superregion");
                next.set("page", "1");
                return next;
              });
            }}
            className="bg-bg-surface border border-celery-700 text-celery-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500"
          >
            <option value="">All salespersons</option>
            {uniqueSalespersons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {/* ── Table ── */}
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
                  Company
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
                  Last activity
                  <SortIcon
                    field="lastActivityAt"
                    sortField={sortField}
                    sortDirection={sortDirection}
                  />
                </span>
              </th>
              <th className="px-4 py-3 text-left">City</th>
              {showSalesperson ? <th className="px-4 py-3 text-left">Salesperson</th> : null}
              {showRegion ? <th className="px-4 py-3 text-left">Region</th> : null}
              {showSuperregion ? <th className="px-4 py-3 text-left">Superregion</th> : null}
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    6 + (showSalesperson ? 1 : 0) + (showRegion ? 1 : 0) + (showSuperregion ? 1 : 0)
                  }
                  className="px-4 py-8 text-center text-celery-600"
                >
                  No clients found
                </td>
              </tr>
            ) : (
              paginated.map((client) => {
                const city = client.addresses?.[0]?.city ?? "—";
                const salesperson = client.assignedTo?.currentHolder
                  ? `${client.assignedTo.currentHolder.firstName} ${client.assignedTo.currentHolder.lastName}`
                  : "—";
                const region = client.assignedTo?.region?.name ?? "—";
                const superregion = client.assignedTo?.region?.parentRegion?.name ?? "—";

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
                    {showSalesperson ? <td className="px-4 py-3">{salesperson}</td> : null}
                    {showRegion ? <td className="px-4 py-3">{region}</td> : null}
                    {showSuperregion ? <td className="px-4 py-3">{superregion}</td> : null}
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
                        items={getActionItems(client, role, onRequestArchive, onDirectArchive)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
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
              : `${(page - 1) * rowsPerPage + 1}–${Math.min(page * rowsPerPage, sorted.length)}`}
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
