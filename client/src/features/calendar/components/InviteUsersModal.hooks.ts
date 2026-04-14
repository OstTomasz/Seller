import { useCallback, useMemo, useState } from "react";
import type { UserForInvite } from "@/types";
import { buildHierarchy, matchesSearch, type SuperRegionNode } from "@/features/users/utils/buildHierarchy";

interface UseInviteSelectionParams {
  users: UserForInvite[];
  selectedIds: string[];
  excludeUserId?: string;
  allowedIds?: string[];
  lockedIds: string[];
}

export const useInviteSelection = ({
  users,
  selectedIds,
  excludeUserId,
  allowedIds,
  lockedIds,
}: UseInviteSelectionParams) => {
  const [search, setSearch] = useState("");
  const [localSelected, setLocalSelected] = useState<string[]>(selectedIds);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [discardOpen, setDiscardOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const hierarchy = useMemo(() => buildHierarchy(users, excludeUserId), [users, excludeUserId]);

  const visibleHierarchy = useMemo(() => {
    const query = search.toLowerCase().trim();
    const isAllowed = (user: UserForInvite) => !allowedIds || allowedIds.includes(user._id);
    const filterUsers = (list: UserForInvite[]) =>
      list.filter((user) => isAllowed(user) && (!query || matchesSearch(user, query)));

    return {
      directors: filterUsers(hierarchy.directors),
      superRegions: hierarchy.superRegions
        .map((superRegion) => ({
          ...superRegion,
          users: filterUsers(superRegion.users),
          subRegions: superRegion.subRegions
            .map((subRegion) => ({ ...subRegion, users: filterUsers(subRegion.users) }))
            .filter((subRegion) => subRegion.users.length > 0),
        }))
        .filter((superRegion) => superRegion.users.length > 0 || superRegion.subRegions.length > 0),
    };
  }, [hierarchy, search, allowedIds]);

  const toggle = (userId: string) => {
    if (lockedIds.includes(userId)) return;
    setIsDirty(true);
    setLocalSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const toggleGroup = (ids: string[]) => {
    const unlocked = ids.filter((id) => !lockedIds.includes(id));
    const allSelected = unlocked.every((id) => localSelected.includes(id));
    setIsDirty(true);
    setLocalSelected((prev) =>
      allSelected ? prev.filter((id) => !unlocked.includes(id)) : [...new Set([...prev, ...unlocked])],
    );
  };

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const superRegionIds = (superRegion: SuperRegionNode): string[] => [
    ...superRegion.users.map((user) => user._id),
    ...superRegion.subRegions.flatMap((subRegion) => subRegion.users.map((user) => user._id)),
  ];

  const resetFromProps = useCallback(() => {
    setLocalSelected(selectedIds);
    setSearch("");
    setDiscardOpen(false);
    setIsDirty(false);
  }, [selectedIds]);

  return {
    search,
    setSearch,
    localSelected,
    setLocalSelected,
    collapsed,
    discardOpen,
    setDiscardOpen,
    isDirty,
    visibleHierarchy,
    toggle,
    toggleGroup,
    toggleCollapse,
    superRegionIds,
    resetFromProps,
  };
};
