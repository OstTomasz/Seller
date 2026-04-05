import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronRight, Crown, Pencil } from "lucide-react";
import { Input, Loader, FetchError } from "@/components/ui";
import { useAuthStore } from "@/store/authStore";
import { useAllPositions, useUsersWithoutPosition } from "./hooks/useManagementStructure";
import { AddPositionModal } from "./modals/AddPositionModal";
import { EditPositionModal } from "./modals/EditPositionModal";
import { EditUserModal } from "./modals/EditUserModal";
import { ManagementActionBtn } from "./components/ManagementActionBtn";
import { ManagementSubRegion } from "./components/ManagementSubRegion";
import { buildManagementHierarchy } from "./utils/buildManagementHierarchy";
import type { PositionWithHolder, UserRole, UserForInvite, User } from "@/types";
import { regionsApi } from "@/api/regions";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/api/users";

export const ManagementStructure = () => {
  const { user } = useAuthStore();
  const role = user?.role as UserRole;
  const isDirector = role === "director";
  const [editUser, setEditUser] = useState<User | null>(null);
  const [addPosition, setAddPosition] = useState<{
    id: string;
    name: string;
    prefix: string;
  } | null>(null);
  const [editPosition, setEditPosition] = useState<PositionWithHolder | null>(null);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [collapsedSubs, setCollapsedSubs] = useState<Set<string>>(new Set());

  const { data: usersWithoutPosition = [] } = useUsersWithoutPosition();
  const { data: positions, isLoading: posLoading, isError: posError } = useAllPositions();
  const {
    data: regions,
    isLoading: regLoading,
    isError: regError,
  } = useQuery({
    queryKey: ["management-regions"],
    queryFn: () => regionsApi.getAll().then((r) => r.data.regions),
  });
  const { data: allUsers = [] } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => usersApi.getAllForStructure().then((r) => r.data.users),
  });

  const toggle = (key: string, setter: React.Dispatch<React.SetStateAction<Set<string>>>) =>
    setter((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  const hierarchy = useMemo(() => {
    if (!regions || !positions) return null;
    return buildManagementHierarchy(regions, positions);
  }, [regions, positions]);

  const visibleHierarchy = useMemo(() => {
    if (!hierarchy) return null;
    const q = search.toLowerCase().trim();
    const filterPositions = (ps: PositionWithHolder[]) =>
      !q
        ? ps
        : ps.filter(
            (p) =>
              p.code.toLowerCase().includes(q) ||
              (p.currentHolder &&
                `${p.currentHolder.firstName} ${p.currentHolder.lastName}`
                  .toLowerCase()
                  .includes(q)),
          );

    if (isDirector) {
      return {
        ...hierarchy,
        superRegions: hierarchy.superRegions.map((sr) => ({
          ...sr,
          subRegions: sr.subRegions.map((sub) => ({
            ...sub,
            positions: filterPositions(sub.positions),
          })),
        })),
      };
    }

    const myPos = positions?.find((p) => p.type === "deputy" && p.currentHolder?._id === user?._id);
    return {
      ...hierarchy,
      superRegions: hierarchy.superRegions
        .filter((sr) => sr.region._id === myPos?.region?._id)
        .map((sr) => ({
          ...sr,
          subRegions: sr.subRegions.map((sub) => ({
            ...sub,
            positions: filterPositions(sub.positions),
          })),
        })),
    };
  }, [hierarchy, isDirector, positions, user?._id, search]);

  const resolveUser = (userId: string) => {
    const u = allUsers.find((u: UserForInvite) => u._id === userId);
    if (u) setEditUser(u as unknown as User);
  };

  if (posLoading || regLoading) return <Loader label="structure" />;
  if (posError || regError || !visibleHierarchy) return <FetchError label="structure" />;

  return (
    <>
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
          {visibleHierarchy.directorPositions.map((p) => (
            <div key={p._id} className="flex items-center gap-2 px-2">
              <Crown className="size-3 text-yellow-500 shrink-0" />
              <div className="flex-1 flex items-center justify-between rounded-lg px-3 py-2 bg-bg-elevated">
                <span className="text-sm text-celery-300">
                  {p.currentHolder ? (
                    `${p.currentHolder.firstName} ${p.currentHolder.lastName}`
                  ) : (
                    <span className="italic text-celery-600">Vacant</span>
                  )}
                  <span className="ml-2 text-xs text-celery-500">{p.code}</span>
                </span>
              </div>
            </div>
          ))}

          {visibleHierarchy.superRegions.map((sr) => {
            const isSrCollapsed = collapsed.has(sr.region._id);
            const deputyHolder = sr.deputyPosition?.currentHolder;

            return (
              <div key={sr.region._id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2 px-2 py-1 w-full rounded text-xs font-semibold text-celery-500 uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => toggle(sr.region._id, setCollapsed)}
                    className="flex items-center gap-2 flex-1 text-left hover:text-celery-300 transition-colors"
                  >
                    {isSrCollapsed ? (
                      <ChevronRight className="size-3.5" />
                    ) : (
                      <ChevronDown className="size-3.5" />
                    )}
                    {sr.region.name} ({sr.region.prefix})
                  </button>
                </div>

                {!isSrCollapsed ? (
                  <div className="flex flex-col gap-1">
                    {sr.deputyPosition ? (
                      <div className="flex items-center justify-between rounded-lg pr-2 bg-bg-elevated">
                        <button
                          type="button"
                          onClick={() => {
                            if (deputyHolder) resolveUser(deputyHolder._id);
                          }}
                          className="text-sm text-celery-300 hover:text-celery-100 transition-colors text-left"
                        >
                          {deputyHolder ? (
                            `${deputyHolder.firstName} ${deputyHolder.lastName}`
                          ) : (
                            <span className="italic text-celery-600">Vacant</span>
                          )}
                          <span className="ml-2 text-xs text-celery-500">
                            {sr.deputyPosition.code}
                          </span>
                        </button>
                        {isDirector ? (
                          <ManagementActionBtn
                            icon={Pencil}
                            onClick={() => setEditPosition(sr.deputyPosition)}
                            title="Manage deputy position"
                          />
                        ) : null}
                      </div>
                    ) : null}

                    {sr.subRegions.map((sub) => (
                      <ManagementSubRegion
                        key={sub.region._id}
                        node={sub}
                        collapsed={collapsedSubs.has(sub.region._id)}
                        onToggle={() => toggle(sub.region._id, setCollapsedSubs)}
                        canEdit
                        onAddPosition={setAddPosition}
                        onEditUser={resolveUser}
                        onEditPosition={setEditPosition}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <AddPositionModal region={addPosition} onClose={() => setAddPosition(null)} />

      <EditUserModal user={editUser} onClose={() => setEditUser(null)} />
      <EditPositionModal
        position={editPosition}
        availableUsers={usersWithoutPosition}
        onClose={() => setEditPosition(null)}
      />
    </>
  );
};
