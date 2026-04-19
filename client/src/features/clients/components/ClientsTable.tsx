import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Client, UserRole } from "@/types";
import { Table, Pagination, Dropdown } from "@/components/ui";
import { useTableParams } from "@/hooks/useTableParams";
import { formatDate } from "@/lib/utils";
import { FiltersBar } from "./ClientsTable.sections";

type SortField = "companyName" | "lastActivityAt" | "_id";

interface ClientsTableProps {
  clients: Client[];
  onRequestArchive: (client: Client) => void;
  onDirectArchive: (client: Client) => void;
}

const getActionItems = (
  client: Client,
  role: UserRole,
  onRequestArchive: (client: Client) => void,
  onDirectArchive: (client: Client) => void,
) => {
  if (role === "salesperson" || role === "deputy") {
    return [
      {
        label: "Request archive",
        onClick: () => onRequestArchive(client),
        variant: "danger" as const,
        disabled: client.status === "archived" || !!client.archiveRequest?.requestedAt,
      },
    ];
  }
  if (role === "advisor") {
    return [{ label: "No actions available", onClick: () => {}, disabled: true }];
  }
  if (role === "director") {
    return [
      {
        label: "Archive",
        onClick: () => onDirectArchive(client),
        variant: "danger" as const,
        disabled: client.status === "archived",
      },
    ];
  }
  return [];
};

export const ClientsTable = ({ clients, onRequestArchive, onDirectArchive }: ClientsTableProps) => {
  const { user } = useAuthStore();
  const role = user?.role as UserRole;
  const navigate = useNavigate();
  const location = useLocation();

  const {
    search,
    sortField,
    sortDirection,
    page,
    rowsPerPage,
    setParam,
    setPage,
    setRowsPerPage,
    handleSort,
    getParam,
    setSearchParams,
  } = useTableParams<SortField>({ defaultSort: "lastActivityAt" });

  const salespersonFilter = getParam("salesperson");
  const regionFilter = getParam("region");
  const superregionFilter = getParam("superregion");

  const showSalesperson = role === "advisor" || role === "deputy" || role === "director";
  const showRegion = role === "deputy" || role === "director";
  const showSuperregion = role === "director";

  const uniqueSalespersons = useMemo(() => {
    const names = clients.map((c) =>
      c.assignedTo?.currentHolder
        ? `${c.assignedTo.currentHolder.firstName} ${c.assignedTo.currentHolder.lastName}`
        : "—",
    );
    return [...new Set(names)];
  }, [clients]);

  const uniqueRegions = useMemo(
    () => [...new Set(clients.map((c) => c.assignedTo?.region?.name ?? "—"))],
    [clients],
  );

  const uniqueSuperregions = useMemo(
    () => [...new Set(clients.map((c) => c.assignedTo?.region?.parentRegion?.name ?? "—"))],
    [clients],
  );

  const filtered = useMemo(
    () =>
      clients.filter((c) => {
        const city = c.addresses?.[0]?.city ?? "";
        const salesperson = c.assignedTo?.currentHolder
          ? `${c.assignedTo.currentHolder.firstName} ${c.assignedTo.currentHolder.lastName}`
          : "";
        return (
          (!search ||
            c.companyName.toLowerCase().includes(search.toLowerCase()) ||
            (c.nip ?? "").includes(search) ||
            city.toLowerCase().includes(search.toLowerCase())) &&
          (!salespersonFilter || salesperson === salespersonFilter) &&
          (!regionFilter || (c.assignedTo?.region?.name ?? "") === regionFilter) &&
          (!superregionFilter ||
            (c.assignedTo?.region?.parentRegion?.name ?? "") === superregionFilter)
        );
      }),
    [clients, search, salespersonFilter, regionFilter, superregionFilter],
  );

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const aVal =
          sortField === "companyName"
            ? a.companyName.toLowerCase()
            : sortField === "lastActivityAt"
              ? a.lastActivityAt
                ? new Date(a.lastActivityAt).getTime()
                : 0
              : a.numericId;
        const bVal =
          sortField === "companyName"
            ? b.companyName.toLowerCase()
            : sortField === "lastActivityAt"
              ? b.lastActivityAt
                ? new Date(b.lastActivityAt).getTime()
                : 0
              : b.numericId;
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      }),
    [filtered, sortField, sortDirection],
  );

  const totalPages = Math.ceil(sorted.length / rowsPerPage);
  const paginated = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const columns = [
    {
      key: "_id",
      header: "ID",
      sortable: true,
      sortField,
      sortDirection,
      onSort: () => handleSort("_id"),
      render: (c: Client) => (
        <span className="text-celery-600 font-mono text-xs">{c.numericId}</span>
      ),
    },
    {
      key: "companyName",
      header: "Company",
      sortable: true,
      sortField,
      sortDirection,
      onSort: () => handleSort("companyName"),
      render: (c: Client) => (
        <button
          onClick={() =>
            navigate(`/clients/${c._id}`, { state: { clientsSearch: location.search } })
          }
          className="text-celery-200 hover:text-celery-100 font-medium text-left"
        >
          {c.companyName}
        </button>
      ),
    },
    {
      key: "lastActivityAt",
      header: "Last activity",
      sortable: true,
      sortField,
      sortDirection,
      onSort: () => handleSort("lastActivityAt"),
      render: (c: Client) => (
        <span className="text-celery-400">{formatDate(c.lastActivityAt)}</span>
      ),
    },
    {
      key: "city",
      header: "City",
      render: (c: Client) => c.addresses?.[0]?.city ?? "—",
    },
    ...(showSalesperson
      ? [
          {
            key: "salesperson",
            header: "Salesperson",
            render: (c: Client) =>
              c.assignedTo?.currentHolder
                ? `${c.assignedTo.currentHolder.firstName} ${c.assignedTo.currentHolder.lastName}`
                : "—",
          },
        ]
      : []),
    ...(showRegion
      ? [
          {
            key: "region",
            header: "Region",
            render: (c: Client) => c.assignedTo?.region?.name ?? "—",
          },
        ]
      : []),
    ...(showSuperregion
      ? [
          {
            key: "superregion",
            header: "Superregion",
            render: (c: Client) => c.assignedTo?.region?.parentRegion?.name ?? "—",
          },
        ]
      : []),
    {
      key: "actions",
      header: "Actions",
      render: (c: Client) => (
        <Dropdown
          trigger={
            <button
              type="button"
              className="px-3 py-1 rounded-md text-xs font-medium bg-celery-800 hover:bg-celery-700 text-celery-300 border border-celery-600"
            >
              Actions
            </button>
          }
          items={getActionItems(c, role, onRequestArchive, onDirectArchive)}
        />
      ),
    },
  ];

  const resetFilters = (keep: string, value: string) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      ["superregion", "region", "salesperson"].forEach((k) => next.delete(k));
      if (value) next.set(keep, value);
      next.set("page", "1");
      return next;
    });

  return (
    <div className="flex flex-col gap-4">
      <FiltersBar
        role={role}
        search={search}
        superregionFilter={superregionFilter}
        regionFilter={regionFilter}
        salespersonFilter={salespersonFilter}
        uniqueSuperregions={uniqueSuperregions}
        uniqueRegions={uniqueRegions}
        uniqueSalespersons={uniqueSalespersons}
        onSearchChange={(value) => setParam("search", value)}
        onFilterChange={(key, value) => resetFilters(key, value)}
      />

      <Table
        columns={columns}
        data={paginated}
        keyExtractor={(c) => c._id}
        emptyMessage="No clients found"
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={sorted.length}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />
    </div>
  );
};
