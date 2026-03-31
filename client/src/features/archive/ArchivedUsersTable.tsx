import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Pagination, Dropdown } from "@/components/ui";
import { useTableParams } from "@/hooks/useTableParams";
import { formatDate } from "@/lib/utils";
import type { ArchivedUser } from "@/types";

type SortField = "lastName" | "archivedAt" | "_id";

interface Props {
  users: ArchivedUser[];
  onUnarchive: (user: ArchivedUser) => void;
}

export const ArchivedUsersTable = ({ users, onUnarchive }: Props) => {
  const navigate = useNavigate();
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
  } = useTableParams<SortField>({ defaultSort: "lastName" });

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          !search ||
          u.firstName.toLowerCase().includes(search.toLowerCase()) ||
          u.lastName.toLowerCase().includes(search.toLowerCase()) ||
          (u.archivedPositionCode ?? "").toLowerCase().includes(search.toLowerCase()),
      ),
    [users, search],
  );

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const aVal =
          sortField === "lastName"
            ? a.lastName.toLowerCase()
            : sortField === "archivedAt"
              ? new Date(a.archivedAt).getTime()
              : a.numericId;
        const bVal =
          sortField === "lastName"
            ? b.lastName.toLowerCase()
            : sortField === "archivedAt"
              ? new Date(b.archivedAt).getTime()
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
      render: (u: ArchivedUser) => (
        <span className="text-celery-600 font-mono text-xs">{u.numericId}</span>
      ),
    },
    {
      key: "lastName",
      header: "Name",
      sortable: true,
      sortField,
      sortDirection,
      onSort: () => handleSort("lastName"),
      render: (u: ArchivedUser) => (
        <button
          onClick={() => navigate(`/users/${u._id}`)}
          className="text-celery-200 hover:text-celery-100 font-medium text-left"
        >
          {u.firstName} {u.lastName}
        </button>
      ),
    },
    {
      key: "archivedPositionCode",
      header: "Last position",
      render: (u: ArchivedUser) => u.archivedPositionCode ?? "—",
    },
    {
      key: "archivedAt",
      header: "Archived at",
      sortable: true,
      sortField,
      sortDirection,
      onSort: () => handleSort("archivedAt"),
      render: (u: ArchivedUser) => (
        <span className="text-celery-400">{formatDate(u.archivedAt)}</span>
      ),
    },
    {
      key: "archivedReason",
      header: "Reason",
      render: (u: ArchivedUser) => (
        <span className="text-celery-500 text-xs">{u.archivedReason}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (u: ArchivedUser) => (
        <Dropdown
          trigger={
            <button
              type="button"
              className="px-3 py-1 rounded-md text-xs font-medium bg-celery-800 hover:bg-celery-700 text-celery-300 border border-celery-600"
            >
              Actions
            </button>
          }
          items={[{ label: "Unarchive", onClick: () => onUnarchive(u) }]}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Search by name or position code..."
        value={search}
        onChange={(e) => setParam("search", e.target.value)}
        className="bg-bg-surface border border-celery-700 text-celery-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500 placeholder:text-celery-600 w-full sm:w-64"
      />
      <Table
        columns={columns}
        data={paginated}
        keyExtractor={(u) => u._id}
        emptyMessage="No archived employees found"
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
