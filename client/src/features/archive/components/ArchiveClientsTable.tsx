import { useMemo } from "react";
import { Client } from "@/types";
import { useNavigate } from "react-router-dom";
import { Dropdown, Input, Pagination, Select, SortableHeader } from "@/components/ui";
import { useTableParams } from "@/hooks/useTableParams";

type SortField = "companyName" | "lastActivityAt" | "_id";

const formatDate = (date: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const ROWS_PER_PAGE_OPTIONS = [10, 20] as const;

interface ArchiveClientsTableProps {
  clients: Client[];
  onUnarchive: (client: Client) => void;
}

export const ArchiveClientsTable = ({ clients, onUnarchive }: ArchiveClientsTableProps) => {
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
    getParam,
  } = useTableParams<SortField>({ defaultSort: "companyName", defaultDir: "asc", defaultRows: 10 });
  const salespersonFilter = getParam("salesperson");

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
        <Input
          type="text"
          placeholder="Search by name, NIP, city..."
          value={search}
          onChange={(e) => setParam("search", e.target.value)}
          surface="elevated"
          hideErrorSpace
          className="w-full sm:w-64 px-3 py-2 text-celery-100"
        />
        <Select
          value={salespersonFilter}
          onChange={(e) => setParam("salesperson", e.target.value)}
          surface="elevated"
          hideErrorSpace
          placeholder="All salespersons"
          placeholderDisabled={false}
          className="min-w-44 px-3 py-2 text-celery-300"
          options={uniqueSalespersons.map((salesperson) => ({
            value: salesperson,
            label: salesperson,
          }))}
        />
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-lg border border-celery-700">
        <table className="w-full text-sm text-celery-300">
          <thead className="bg-celery-800 text-celery-500 uppercase text-xs tracking-wider">
            <tr>
              <SortableHeader
                label="ID"
                field="_id"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={(field) => handleSort(field as SortField)}
              />
              <SortableHeader
                label="Company"
                field="companyName"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={(field) => handleSort(field as SortField)}
              />
              <SortableHeader
                label="Last activity"
                field="lastActivityAt"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={(field) => handleSort(field as SortField)}
              />
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
                          navigate(`/clients/${client._id}`, { state: { from: "archive" } })
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
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={sorted.length}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        onPageChange={setPage}
        onRowsPerPageChange={(n) => setRowsPerPage(n as 10 | 20)}
      />
    </div>
  );
};
