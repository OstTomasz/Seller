import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronRight, Crown, Pencil, Plus } from "lucide-react";
import { Input, Loader, FetchError } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useAllPositions } from "./hooks/useManagementStructure";
import { AddPositionModal } from "./modals/AddPositionModal";
import { RemovePositionModal } from "./modals/RemovePositionModal";
import { EditPositionModal } from "./modals/EditPositionModal";
import { EditUserModal } from "./modals/EditUserModal";
import type { PositionWithHolder, UserRole, Region, UserForInvite, User } from "@/types";
import { regionsApi } from "@/api/regions";
import { useQuery } from "@tanstack/react-query";
import { useUsersWithoutPosition } from "./hooks/useManagementStructure";
import { usersApi } from "@/api/users";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SubRegionNode {
  region: Region;
  positions: PositionWithHolder[];
}

interface SuperRegionNode {
  region: Region;
  deputyPosition: PositionWithHolder | null;
  subRegions: SubRegionNode[];
}

// ── Hierarchy builder from positions ─────────────────────────────────────────

const buildManagementHierarchy = (
  regions: Region[],
  positions: PositionWithHolder[],
): { directorPositions: PositionWithHolder[]; superRegions: SuperRegionNode[] } => {
  const directorPositions = positions.filter((p) => p.type === "director");

  const superregions = regions.filter((r) => r.parentRegion === null);
  const subregions = regions.filter((r) => r.parentRegion !== null);

  const superRegions: SuperRegionNode[] = superregions.map((sr) => {
    const deputyPosition =
      positions.find((p) => p.type === "deputy" && p.region?._id === sr._id) ?? null;

    const subs: SubRegionNode[] = subregions
      .filter((sub) => {
        const parent = typeof sub.parentRegion === "string" ? sub.parentRegion : sub.parentRegion;
        return parent === sr._id;
      })
      .map((sub) => ({
        region: sub,
        positions: positions.filter((p) => p.region?._id === sub._id),
      }));

    return { region: sr, deputyPosition, subRegions: subs };
  });

  return { directorPositions, superRegions };
};

// ── Action button ─────────────────────────────────────────────────────────────

const ActionBtn = ({
  icon: Icon,
  onClick,
  title,
  variant = "default",
}: {
  icon: React.ElementType;
  onClick: () => void;
  title: string;
  variant?: "default" | "danger";
}) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    title={title}
    className={cn(
      "p-1 rounded transition-colors",
      variant === "danger"
        ? "text-celery-600 hover:text-red-400"
        : "text-celery-600 hover:text-celery-300",
    )}
  >
    <Icon className="size-3.5" />
  </button>
);

// ── Position row ──────────────────────────────────────────────────────────────

const PositionRow = ({
  position,
  canEdit,
  onEditPosition,
  onEditUser,
}: {
  position: PositionWithHolder;
  canEdit: boolean;
  onEditPosition: (p: PositionWithHolder) => void;
  onEditUser: (userId: string) => void;
}) => (
  <div className="flex items-center justify-between rounded-lg pr-2 bg-bg-elevated">
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (position.currentHolder) onEditUser(position.currentHolder._id);
      }}
      className="text-celery-300 hover:text-celery-100 transition-colors text-left"
    >
      {position.currentHolder ? (
        `${position.currentHolder.firstName} ${position.currentHolder.lastName}`
      ) : (
        <span className="italic text-celery-600">Vacant</span>
      )}
      <span className="ml-2 text-xs text-celery-500">{position.code}</span>
    </button>
    {canEdit ? (
      <ActionBtn icon={Pencil} onClick={() => onEditPosition(position)} title="Manage position" />
    ) : null}
  </div>
);

// ── SubRegion section ─────────────────────────────────────────────────────────

const SubRegionSection = ({
  node,
  collapsed,
  onToggle,
  canEdit,

  onAddPosition,
  onEditUser,
  onEditPosition,
}: {
  node: SubRegionNode;
  collapsed: boolean;
  onToggle: () => void;
  canEdit: boolean;

  onAddPosition: (r: { id: string; name: string; prefix: string }) => void;
  onEditUser: (userId: string) => void;
  onEditPosition: (p: PositionWithHolder) => void;
}) => (
  <div className="flex flex-col gap-1 ml-4">
    <div
      className="flex items-center gap-2 px-2 py-1 w-full rounded
          text-xs font-semibold text-celery-500 uppercase tracking-wider"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 flex-1 text-left hover:text-celery-300 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="size-3.5 shrink-0" />
        ) : (
          <ChevronDown className="size-3.5 shrink-0" />
        )}
        {node.region.name} ({node.region.prefix})
      </button>
      {canEdit ? (
        <ActionBtn
          icon={Plus}
          onClick={() =>
            onAddPosition({
              id: node.region._id,
              name: node.region.name,
              prefix: node.region.prefix,
            })
          }
          title="Add position"
        />
      ) : null}
    </div>
    {!collapsed ? (
      <div className="flex flex-col gap-1 ml-6">
        {node.positions.map((p) => (
          <PositionRow
            key={p._id}
            position={p}
            canEdit={canEdit}
            onEditPosition={onEditPosition}
            onEditUser={onEditUser}
          />
        ))}
      </div>
    ) : null}
  </div>
);

// ── ManagementStructure ───────────────────────────────────────────────────────

export const ManagementStructure = () => {
  const { user } = useAuthStore();
  const role = user?.role as UserRole;
  const isDirector = role === "director";
  const [editUser, setEditUser] = useState<User | null>(null);

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

  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [collapsedSubs, setCollapsedSubs] = useState<Set<string>>(new Set());

  // Modal state
  const [addPosition, setAddPosition] = useState<{
    id: string;
    name: string;
    prefix: string;
  } | null>(null);
  const [removePosition, setRemovePosition] = useState<{ id: string; code: string } | null>(null);
  const [editPosition, setEditPosition] = useState<PositionWithHolder | null>(null);

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

  // Deputy — filter to own superregion only
  const visibleHierarchy = useMemo(() => {
    if (!hierarchy) return null;
    const q = search.toLowerCase().trim();

    const filterPositions = (positions: PositionWithHolder[]) => {
      if (!q) return positions;
      return positions.filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          (p.currentHolder &&
            `${p.currentHolder.firstName} ${p.currentHolder.lastName}`.toLowerCase().includes(q)),
      );
    };

    let result = hierarchy;

    if (isDirector) {
      result = {
        ...hierarchy,
        superRegions: hierarchy.superRegions.map((sr) => ({
          ...sr,
          subRegions: sr.subRegions.map((sub) => ({
            ...sub,
            positions: filterPositions(sub.positions),
          })),
        })),
      };
    } else {
      const myPos = positions?.find(
        (p) => p.type === "deputy" && p.currentHolder?._id === user?._id,
      );
      result = {
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
    }

    return result;
  }, [hierarchy, isDirector, positions, user?._id, search]);

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
          {/* Director positions */}
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

          {/* Superregions */}
          {visibleHierarchy.superRegions.map((sr) => {
            const isSrCollapsed = collapsed.has(sr.region._id);
            const deputyHolder = sr.deputyPosition?.currentHolder;

            return (
              <div key={sr.region._id} className="flex flex-col gap-1">
                {/* Superregion header */}
                <div
                  className="flex items-center gap-2 px-2 py-1 w-full rounded
                text-xs font-semibold text-celery-500 uppercase tracking-wider"
                >
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
                    {/* Deputy row */}
                    {sr.deputyPosition ? (
                      <div className="flex items-center justify-between rounded-lg pr-2 bg-bg-elevated">
                        <button
                          type="button"
                          onClick={() => {
                            if (!deputyHolder) return;
                            const u = allUsers.find(
                              (u: UserForInvite) => u._id === deputyHolder._id,
                            );
                            if (u) setEditUser(u as unknown as User);
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
                        {isDirector && sr.deputyPosition ? (
                          <ActionBtn
                            icon={Pencil}
                            onClick={() => setEditPosition(sr.deputyPosition)}
                            title="Manage deputy position"
                          />
                        ) : null}
                      </div>
                    ) : null}

                    {/* Subregions */}
                    {sr.subRegions.map((sub) => (
                      <SubRegionSection
                        key={sub.region._id}
                        node={sub}
                        collapsed={collapsedSubs.has(sub.region._id)}
                        onToggle={() => toggle(sub.region._id, setCollapsedSubs)}
                        canEdit
                        onAddPosition={setAddPosition}
                        onEditUser={(userId) => {
                          const u = allUsers.find((u: UserForInvite) => u._id === userId);
                          if (u) setEditUser(u as unknown as User);
                        }}
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

      {/* Modals */}

      <AddPositionModal region={addPosition} onClose={() => setAddPosition(null)} />
      <RemovePositionModal position={removePosition} onClose={() => setRemovePosition(null)} />

      <EditUserModal user={editUser} onClose={() => setEditUser(null)} />
      <EditPositionModal
        position={editPosition}
        availableUsers={usersWithoutPosition}
        onClose={() => setEditPosition(null)}
      />
    </>
  );
};
