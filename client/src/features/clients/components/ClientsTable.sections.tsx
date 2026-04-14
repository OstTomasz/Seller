import type { UserRole } from "@/types";

interface FiltersBarProps {
  role: UserRole;
  search: string;
  superregionFilter: string;
  regionFilter: string;
  salespersonFilter: string;
  uniqueSuperregions: string[];
  uniqueRegions: string[];
  uniqueSalespersons: string[];
  onSearchChange: (value: string) => void;
  onFilterChange: (key: "superregion" | "region" | "salesperson", value: string) => void;
}

export const FiltersBar = ({
  role,
  search,
  superregionFilter,
  regionFilter,
  salespersonFilter,
  uniqueSuperregions,
  uniqueRegions,
  uniqueSalespersons,
  onSearchChange,
  onFilterChange,
}: FiltersBarProps) => {
  const showSalesperson = role === "advisor" || role === "deputy" || role === "director";
  const showRegion = role === "deputy" || role === "director";
  const showSuperregion = role === "director";
  const selectClass =
    "bg-bg-surface border border-celery-700 text-celery-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500";

  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="text"
        placeholder="Search by name, NIP, city..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="bg-bg-surface border border-celery-700 text-celery-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500 placeholder:text-celery-600 w-full sm:w-64"
      />
      {showSuperregion ? (
        <select
          value={superregionFilter}
          onChange={(e) => onFilterChange("superregion", e.target.value)}
          className={selectClass}
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
        <select value={regionFilter} onChange={(e) => onFilterChange("region", e.target.value)} className={selectClass}>
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
          onChange={(e) => onFilterChange("salesperson", e.target.value)}
          className={selectClass}
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
  );
};
