import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Crown, ChevronDown, ChevronRight } from "lucide-react";
import { Input, Loader, FetchError } from "@/components/ui";
import { useCompanyStructure } from "./hooks/useCompanyStructure";
import type { PositionWithHolder } from "@/types";

const UserRow = ({ position }: { position: PositionWithHolder }) => {
  const navigate = useNavigate();
  const holder = position.currentHolder;

  return (
    <button
      type="button"
      onClick={() => holder && navigate(`/users/${holder._id}`)}
      disabled={!holder}
      className="flex items-center justify-between rounded-lg px-3 py-2 w-full
                 text-sm bg-bg-elevated text-celery-300 hover:bg-celery-800
                 transition-colors text-left disabled:cursor-default disabled:hover:bg-bg-elevated"
    >
      <span>
        {holder ? (
          `${holder.firstName} ${holder.lastName}`
        ) : (
          <span className="italic text-celery-600">Vacant</span>
        )}
        {holder ? <span className="ml-2 text-xs text-celery-600">#{holder.numericId}</span> : null}
      </span>
      <span className="text-xs text-celery-500 shrink-0">{position.code}</span>
    </button>
  );
};

export const CompanyStructure = () => {
  const { data: hierarchy, isLoading, isError } = useCompanyStructure();
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [collapsedSubs, setCollapsedSubs] = useState<Set<string>>(new Set());

  const toggle = (key: string, setter: React.Dispatch<React.SetStateAction<Set<string>>>) =>
    setter((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  const visible = useMemo(() => {
    if (!hierarchy) return null;
    const q = search.toLowerCase().trim();
    if (!q) return hierarchy;

    const filterPos = (positions: PositionWithHolder[]) =>
      positions.filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          (p.currentHolder &&
            `${p.currentHolder.firstName} ${p.currentHolder.lastName}`.toLowerCase().includes(q)),
      );

    return {
      ...hierarchy,
      superRegions: hierarchy.superRegions
        .map((sr) => ({
          ...sr,
          subRegions: sr.subRegions
            .map((sub) => ({ ...sub, positions: filterPos(sub.positions) }))
            .filter((sub) => sub.positions.length > 0),
        }))
        .filter((sr) => sr.subRegions.length > 0 || sr.deputyPosition),
    };
  }, [hierarchy, search]);

  if (isLoading) return <Loader label="structure" />;
  if (isError || !visible) return <FetchError label="structure" />;

  return (
    <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-3 size-4 text-celery-500 pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or code…"
          className="pl-9"
        />
      </div>

      <div className="flex flex-col gap-2">
        {/* Directors */}
        {visible.directorPositions.map((p) => (
          <div key={p._id} className="flex items-center gap-2 px-2">
            <Crown className="size-3 text-yellow-500 shrink-0" />
            <UserRow position={p} />
          </div>
        ))}

        {/* Superregions */}
        {visible.superRegions.map((sr) => {
          const isSrCollapsed = collapsed.has(sr.region._id);
          return (
            <div key={sr.region._id} className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => toggle(sr.region._id, setCollapsed)}
                className="flex items-center gap-2 px-2 py-1 w-full rounded text-left
                           text-xs font-semibold text-celery-500 uppercase tracking-wider
                           hover:bg-celery-800 transition-colors"
              >
                {isSrCollapsed ? (
                  <ChevronRight className="size-3.5" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
                {sr.region.name} ({sr.region.prefix})
              </button>

              {!isSrCollapsed ? (
                <div className="flex flex-col gap-1">
                  {sr.deputyPosition ? <UserRow position={sr.deputyPosition} /> : null}

                  {sr.subRegions.map((sub) => {
                    const isSubCollapsed = collapsedSubs.has(sub.region._id);
                    return (
                      <div key={sub.region._id} className="flex flex-col gap-1 ml-4">
                        <button
                          type="button"
                          onClick={() => toggle(sub.region._id, setCollapsedSubs)}
                          className="flex items-center gap-2 px-2 py-1 w-full rounded text-left
                                     text-xs font-semibold text-celery-500 uppercase tracking-wider
                                     hover:bg-celery-800 transition-colors"
                        >
                          {isSubCollapsed ? (
                            <ChevronRight className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )}
                          {sub.region.name} ({sub.region.prefix})
                        </button>
                        {!isSubCollapsed ? (
                          <div className="flex flex-col gap-1 ml-6">
                            {sub.positions.map((p) => (
                              <UserRow key={p._id} position={p} />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
