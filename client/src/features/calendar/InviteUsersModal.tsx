// client/src/features/calendar/InviteUsersModal.tsx
import { useState, useMemo, useEffect } from "react";
import { Search, Check, Users, ChevronDown, ChevronRight, Crown } from "lucide-react";
import { Modal, Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useUsersForInvite } from "./hooks/useUsersForInvite";
import type { UserForInvite } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SubRegionNode {
  id: string;
  name: string;
  prefix: string;
  users: UserForInvite[];
}

interface SuperRegionNode {
  id: string | null;
  name: string;
  prefix: string;
  users: UserForInvite[]; // deputy-level users
  subRegions: SubRegionNode[];
}

interface HierarchyNode {
  directors: UserForInvite[];
  superRegions: SuperRegionNode[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const buildHierarchy = (users: UserForInvite[], excludeId?: string): HierarchyNode => {
  const filtered = excludeId ? users.filter((u) => u._id !== excludeId) : users;

  const directors = filtered.filter((u) => u.position?.region === null || !u.position);

  // Build superregion map: parentRegion === null means it IS a superregion
  const superRegionMap = new Map<string, SuperRegionNode>();

  filtered
    .filter((u) => u.position?.region && u.position.region.parentRegion === null)
    .forEach((u) => {
      const region = u.position!.region!;
      if (!superRegionMap.has(region._id)) {
        superRegionMap.set(region._id, {
          id: region._id,
          name: region.name,
          prefix: region.prefix,
          users: [],
          subRegions: [],
        });
      }
      superRegionMap.get(region._id)!.users.push(u);
    });

  // Build subregion map: parentRegion !== null
  const subRegionMap = new Map<string, SubRegionNode>();

  filtered
    .filter((u) => u.position?.region && u.position.region.parentRegion !== null)
    .forEach((u) => {
      const region = u.position!.region!;
      if (!subRegionMap.has(region._id)) {
        subRegionMap.set(region._id, {
          id: region._id,
          name: region.name,
          prefix: region.prefix,
          users: [],
        });
      }
      subRegionMap.get(region._id)!.users.push(u);
    });

  // Attach subregions to superregions
  subRegionMap.forEach((subRegion, _subId) => {
    // Find parent superregion via any user in this subregion
    const sampleUser = filtered.find((u) => u.position?.region?._id === subRegion.id);
    const parentId = sampleUser?.position?.region?.parentRegion;
    if (parentId && superRegionMap.has(parentId)) {
      superRegionMap.get(parentId)!.subRegions.push(subRegion);
    }
  });

  // Sort subregions alphabetically
  superRegionMap.forEach((sr) => {
    sr.subRegions.sort((a, b) => a.name.localeCompare(b.name));
    sr.users.sort((a, b) => a.lastName.localeCompare(b.lastName));
  });

  return {
    directors,
    superRegions: Array.from(superRegionMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
  };
};

const matchesSearch = (user: UserForInvite, q: string): boolean =>
  user.firstName.toLowerCase().includes(q) ||
  user.lastName.toLowerCase().includes(q) ||
  String(user.numericId).includes(q) ||
  (user.position?.code.toLowerCase().includes(q) ?? false);

// ── Sub-components ────────────────────────────────────────────────────────────

const UserRow = ({
  user,
  isSelected,
  onToggle,
}: {
  user: UserForInvite;
  isSelected: boolean;
  onToggle: (id: string) => void;
  indent?: boolean;
}) => (
  <button
    type="button"
    onClick={() => onToggle(user._id)}
    className={cn(
      "flex items-center justify-between rounded-lg px-3 py-2 w-full",
      "text-sm transition-colors text-left",
      isSelected
        ? "bg-celery-700 text-celery-100"
        : "bg-bg-elevated text-celery-300 hover:bg-celery-800",
    )}
  >
    <span>
      {user.firstName} {user.lastName}
      <span className="ml-2 text-xs text-celery-500">#{user.numericId}</span>
    </span>
    <span className="flex items-center gap-2 shrink-0">
      {user.position ? <span className="text-xs text-celery-500">{user.position.code}</span> : null}
      {isSelected ? <Check className="size-3 text-celery-300" /> : null}
    </span>
  </button>
);

const GroupHeader = ({
  label,
  allSelected,
  someSelected,
  onToggleAll,
  collapsible = false,
  collapsed = false,
  onToggleCollapse,
  indent = false,
}: {
  label: string;
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: () => void;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  indent?: boolean;
}) => (
  <div className={cn("flex items-center gap-1", indent && "ml-2")}>
    {collapsible ? (
      <button
        type="button"
        onClick={onToggleCollapse}
        className="p-0.5 text-celery-600 hover:text-celery-400 transition-colors"
      >
        {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      </button>
    ) : (
      <span className="size-4" />
    )}
    <button
      type="button"
      onClick={onToggleAll}
      className="flex items-center justify-between flex-1 px-2 py-1 rounded
                 text-xs font-semibold text-celery-500 uppercase tracking-wider
                 hover:bg-celery-800 transition-colors"
    >
      <span className="flex items-center gap-2">
        <Users className="size-3" />
        {label}
      </span>
      <span
        className={cn(
          "text-xs font-normal normal-case tracking-normal",
          allSelected ? "text-celery-300" : "text-celery-700",
        )}
      >
        {allSelected ? "Deselect all" : someSelected ? "Select all" : "Select all"}
      </span>
    </button>
  </div>
);

// ── Props ─────────────────────────────────────────────────────────────────────

interface InviteUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
  excludeUserId?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const InviteUsersModal = ({
  isOpen,
  onClose,
  selectedIds,
  onConfirm,
  excludeUserId,
}: InviteUsersModalProps) => {
  const { data: users = [], isLoading } = useUsersForInvite();
  const [search, setSearch] = useState("");
  const [localSelected, setLocalSelected] = useState<string[]>(selectedIds);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Sync selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSelected(selectedIds);
      setSearch("");
    }
  }, [isOpen, selectedIds]);

  const hierarchy = useMemo(() => {
    return buildHierarchy(users, excludeUserId);
  }, [users, excludeUserId]);

  // Filter hierarchy nodes for display based on search
  const visibleHierarchy = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return hierarchy;

    return {
      directors: hierarchy.directors.filter((u) => matchesSearch(u, q)),
      superRegions: hierarchy.superRegions
        .map((sr) => ({
          ...sr,
          users: sr.users.filter((u) => matchesSearch(u, q)),
          subRegions: sr.subRegions
            .map((sub) => ({
              ...sub,
              users: sub.users.filter((u) => matchesSearch(u, q)),
            }))
            .filter((sub) => sub.users.length > 0),
        }))
        .filter((sr) => sr.users.length > 0 || sr.subRegions.length > 0),
    };
  }, [hierarchy, search]);

  const toggle = (userId: string) =>
    setLocalSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );

  const toggleGroup = (ids: string[]) => {
    const allSelected = ids.every((id) => localSelected.includes(id));
    setLocalSelected((prev) =>
      allSelected ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])],
    );
  };

  const toggleCollapse = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // Collect all IDs in a node for group select
  const superRegionIds = (sr: SuperRegionNode): string[] => [
    ...sr.users.map((u) => u._id),
    ...sr.subRegions.flatMap((sub) => sub.users.map((u) => u._id)),
  ];

  const handleConfirm = () => {
    onConfirm(localSelected);
    onClose();
  };

  const handleClose = () => {
    setLocalSelected(selectedIds);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite participants" size="md">
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-celery-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID or code…"
            className="pl-9"
          />
        </div>

        {localSelected.length > 0 ? (
          <p className="text-xs text-celery-500">
            {localSelected.length} participant{localSelected.length > 1 ? "s" : ""} selected
          </p>
        ) : null}

        {/* Hierarchy list */}
        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
          {isLoading ? (
            <p className="text-xs text-celery-600 text-center py-4">Loading…</p>
          ) : (
            <>
              {/* Directors */}
              {visibleHierarchy.directors.map((user) => (
                <div key={user._id} className="flex items-center gap-2 px-2">
                  <Crown className="size-3 text-gold-400 shrink-0" />
                  <UserRow
                    user={user}
                    isSelected={localSelected.includes(user._id)}
                    onToggle={toggle}
                  />
                </div>
              ))}

              {/* SuperRegions */}
              {visibleHierarchy.superRegions.map((sr) => {
                const srIds = superRegionIds(sr);
                const allSrSelected = srIds.every((id) => localSelected.includes(id));
                const someSrSelected =
                  !allSrSelected && srIds.some((id) => localSelected.includes(id));
                const isSrCollapsed = collapsed.has(sr.prefix);

                return (
                  <div key={sr.prefix} className="flex flex-col gap-1">
                    <GroupHeader
                      label={`${sr.name} (${sr.prefix})`}
                      allSelected={allSrSelected}
                      someSelected={someSrSelected}
                      onToggleAll={() => toggleGroup(srIds)}
                      collapsible
                      collapsed={isSrCollapsed}
                      onToggleCollapse={() => toggleCollapse(sr.prefix)}
                    />

                    {!isSrCollapsed ? (
                      <div className="flex flex-col gap-1">
                        {/* Deputy-level users in superregion */}
                        {sr.users.map((user) => (
                          <UserRow
                            key={user._id}
                            user={user}
                            isSelected={localSelected.includes(user._id)}
                            onToggle={toggle}
                            indent
                          />
                        ))}

                        {/* SubRegions */}
                        {sr.subRegions.map((sub) => {
                          const allSubSelected = sub.users
                            .map((u) => u._id)
                            .every((id) => localSelected.includes(id));
                          const someSubSelected =
                            !allSubSelected &&
                            sub.users.map((u) => u._id).some((id) => localSelected.includes(id));
                          const isSubCollapsed = collapsed.has(sub.prefix);

                          return (
                            <div key={sub.prefix} className="flex flex-col gap-1">
                              <GroupHeader
                                label={`${sub.name} (${sub.prefix})`}
                                allSelected={allSubSelected}
                                someSelected={someSubSelected}
                                onToggleAll={() => toggleGroup(sub.users.map((u) => u._id))}
                                collapsible
                                collapsed={isSubCollapsed}
                                onToggleCollapse={() => toggleCollapse(sub.prefix)}
                                indent
                              />

                              {!isSubCollapsed ? (
                                <div className="flex flex-col gap-1 ml-6">
                                  {sub.users.map((user) => (
                                    <UserRow
                                      key={user._id}
                                      user={user}
                                      isSelected={localSelected.includes(user._id)}
                                      onToggle={toggle}
                                    />
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

              {visibleHierarchy.directors.length === 0 &&
              visibleHierarchy.superRegions.length === 0 ? (
                <p className="text-xs text-celery-600 text-center py-4">No users found.</p>
              ) : null}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            {localSelected.length > 0
              ? `Invite ${localSelected.length} participant${localSelected.length > 1 ? "s" : ""}`
              : "Confirm"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
