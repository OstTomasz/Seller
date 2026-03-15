import { useState, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { Client, UserRole } from "@/types";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type SortField = "companyName" | "lastActivityAt" | "_id";
type SortDirection = "asc" | "desc";

interface ClientsTableProps {
  clients: Client[];
  onClientClick: (client: Client) => void;
  onActionsClick: (client: Client, anchor: HTMLElement) => void;
}

const STATUS_LABELS: Record<string, string> = {
  active:   "Active",
  reminder: "Reminder",
  inactive: "Inactive",
  archived: "Archived",
};

const STATUS_BADGE_VARIANTS: Record<string, "active" | "warning" | "error" | "muted"> = {
  active:   "active",
  reminder: "warning",
  inactive: "error",
  archived: "muted",
};

const formatDate = (date: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const SortIcon = ({ field, sortField, sortDirection }: {
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
}) => {
  if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return sortDirection === "asc"
    ? <ArrowUp className="h-3 w-3 text-celery-400" />
    : <ArrowDown className="h-3 w-3 text-celery-400" />;
};

const ROWS_PER_PAGE_OPTIONS = [10, 20] as const;

export const ClientsTable = ({ clients, onClientClick, onActionsClick }: ClientsTableProps) => {
  const { user } = useAuthStore();
  const role = user?.role as UserRole;

  const [sortField, setSortField]       = useState<SortField>("companyName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [regionFilter, setRegionFilter] = useState<string>("");
  const [superregionFilter, setSuperregionFilter] = useState<string>("");
  const [salespersonFilter, setSalespersonFilter] = useState<string>("");
  const [page, setPage]                 = useState(1);
  const [rowsPerPage, setRowsPerPage]   = useState<10 | 20>(10);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setPage(1);
  };

  // unique values for filter dropdowns
  const uniqueStatuses    = useMemo(() => [...new Set(clients.map((c) => c.status))], [clients]);
  const uniqueSalespersons = useMemo(() => {
    const names = clients.map((c) =>
      c.assignedTo?.currentHolder
        ? `${(c.assignedTo as any).currentHolder.firstName} ${(c.assignedTo as any).currentHolder.lastName}`
        : "—"
    );
    return [...new Set(names)];
  }, [clients]);
  const uniqueRegions = useMemo(() => {
    const regions = clients.map((c) => (c.assignedTo as any)?.region?.name ?? "—");
    return [...new Set(regions)];
  }, [clients]);
const uniqueSuperregions = useMemo(() => {
  const superregions = clients.map((c) =>
    c.assignedTo?.region?.parentRegion?.name ?? "—"
  );
  return [...new Set(superregions)];
}, [clients]);


const filtered = useMemo(() => {
  return clients.filter((c) => {
    const city = c.addresses?.[0]?.city ?? "";
    const salesperson = c.assignedTo?.currentHolder
      ? `${c.assignedTo.currentHolder.firstName} ${c.assignedTo.currentHolder.lastName}`
      : "";
    const region      = c.assignedTo?.region?.name ?? "";
    const superregion = c.assignedTo?.region?.parentRegion?.name ?? "";

    const matchesSearch =
      !search ||
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (c.nip ?? "").includes(search) ||
      city.toLowerCase().includes(search.toLowerCase());

    const matchesStatus       = !statusFilter       || c.status === statusFilter;
    const matchesSalesperson  = !salespersonFilter  || salesperson === salespersonFilter;
    const matchesRegion       = !regionFilter       || region === regionFilter;
    const matchesSuperregion  = !superregionFilter  || superregion === superregionFilter;

    return matchesSearch && matchesStatus && matchesSalesperson && matchesRegion && matchesSuperregion;
  });
}, [clients, search, statusFilter, salespersonFilter, regionFilter, superregionFilter]);

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
  const paginated  = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const showSalesperson = role === "advisor" || role === "deputy" || role === "director";
  const showRegion      = role === "deputy" || role === "director";
  const showSuperregion = role === "director";

  return (
    <div className="flex flex-col gap-4">

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name, NIP, city..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="bg-bg-surface border border-celery-700 text-celery-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500 placeholder:text-celery-600 w-full sm:w-64"
        />

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-bg-surface border border-celery-700 text-celery-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500"
        >
          <option value="">All statuses</option>
          {uniqueStatuses.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
          ))}
        </select>

{showSuperregion ? (
  <select
    value={superregionFilter}
    onChange={(e) => {
      setSuperregionFilter(e.target.value);
      setRegionFilter("");
      setSalespersonFilter("");
      setPage(1);
    }}
    className="bg-bg-surface border border-celery-700 text-celery-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500"
  >
    <option value="">All superregions</option>
    {uniqueSuperregions.map((s) => (
      <option key={s} value={s}>{s}</option>
    ))}
  </select>
) : null}

{showRegion ? (
  <select
    value={regionFilter}
    onChange={(e) => {
      setRegionFilter(e.target.value);
      setSuperregionFilter("");
      setSalespersonFilter("");
      setPage(1);
    }}
    className="bg-bg-surface border border-celery-700 text-celery-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500"
  >
    <option value="">All regions</option>
    {uniqueRegions.map((r) => (
      <option key={r} value={r}>{r}</option>
    ))}
  </select>
) : null}

{showSalesperson ? (
  <select
    value={salespersonFilter}
    onChange={(e) => {
      setSalespersonFilter(e.target.value);
      setRegionFilter("");
      setSuperregionFilter("");
      setPage(1);
    }}
    className="bg-bg-surface border border-celery-700 text-celery-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500"
  >
    <option value="">All salespersons</option>
    {uniqueSalespersons.map((s) => (
      <option key={s} value={s}>{s}</option>
    ))}
  </select>
) : null}
      </div>



      {/* ── Table ── */}
      <div className="w-full overflow-x-auto rounded-lg border border-celery-700">
        <table className="w-full text-sm text-celery-300">
          <thead className="bg-celery-800 text-celery-500 uppercase text-xs tracking-wider">
            <tr>
                            <th className="px-4 py-3 text-left">Actions</th>
              {/* ID */}
              <th
                className="px-4 py-3 text-left cursor-pointer select-none"
                onClick={() => handleSort("_id")}
              >
                <span className="flex items-center gap-1 cursor-pointer">
                  ID <SortIcon field="_id" sortField={sortField} sortDirection={sortDirection} />
                </span>
              </th>

              {/* Company name */}
              <th
                className="px-4 py-3 text-left cursor-pointer select-none"
                onClick={() => handleSort("companyName")}
              >
                <span className="flex items-center gap-1 cursor-pointer">
                  Company <SortIcon field="companyName" sortField={sortField} sortDirection={sortDirection} />
                </span>
              </th>

              <th className="px-4 py-3 text-left">Status</th>

              {/* Last activity */}
              <th
                className="px-4 py-3 text-left cursor-pointer select-none"
                onClick={() => handleSort("lastActivityAt")}
              >
                <span className="flex items-center gap-1 cursor-pointer">
                  Last activity <SortIcon field="lastActivityAt" sortField={sortField} sortDirection={sortDirection} />
                </span>
              </th>

              <th className="px-4 py-3 text-left">City</th>

              {showSalesperson ? <th className="px-4 py-3 text-left">Salesperson</th> : null}
              {showRegion      ? <th className="px-4 py-3 text-left">Region</th>      : null}
              {showSuperregion ? <th className="px-4 py-3 text-left">Superregion</th> : null}


            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
colSpan={7 + (showSalesperson ? 1 : 0) + (showRegion ? 1 : 0) + (showSuperregion ? 1 : 0)}
                  className="px-4 py-8 text-center text-celery-600"
                >
                  No clients found
                </td>
              </tr>
            ) : (
              paginated.map((client) => {
                const city        = client.addresses?.[0]?.city ?? "—";
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
                                        <td className="px-4 py-3">
                      <button
                        onClick={(e) => onActionsClick(client, e.currentTarget)}
                        className="px-3 py-1 rounded-md text-xs font-medium bg-celery-800 hover:bg-celery-700 text-celery-300 border border-celery-600"
                      >
                        Actions
                      </button>
                    </td>
                    <td className="px-4 py-3 text-celery-600 font-mono text-xs">
   {client.numericId}
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => onClientClick(client)}
                        className="text-celery-200 hover:text-celery-100 font-medium text-left"
                      >
                        {client.companyName}
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE_VARIANTS[client.status] ?? "muted"}>
                        {STATUS_LABELS[client.status] ?? client.status}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-celery-400">
                      {formatDate(client.lastActivityAt)}
                    </td>

                    <td className="px-4 py-3">{city}</td>

                    {showSalesperson ? <td className="px-4 py-3">{salesperson}</td> : null}
                    {showRegion      ? <td className="px-4 py-3">{region}</td>      : null}
                    {showSuperregion ? <td className="px-4 py-3">{superregion}</td> : null}


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
              onClick={() => { setRowsPerPage(n); setPage(1); }}
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
            {sorted.length === 0 ? "0" : `${(page - 1) * rowsPerPage + 1}–${Math.min(page * rowsPerPage, sorted.length)}`} of {sorted.length}
          </span>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                <span key={`ellipsis-${i}`} className="px-2">…</span>
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
              )
            )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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