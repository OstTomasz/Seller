import { Crown } from "lucide-react";
import { GroupHeader, UserRow } from "./InviteUsersModal.sections";
import type { UserForInvite } from "@/types";
import type { SuperRegionNode } from "@/features/users/utils/buildHierarchy";

interface VisibleHierarchy {
  directors: UserForInvite[];
  superRegions: SuperRegionNode[];
}

interface HierarchyListProps {
  isLoading: boolean;
  visibleHierarchy: VisibleHierarchy;
  localSelected: string[];
  lockedIds: string[];
  collapsed: Set<string>;
  toggle: (id: string) => void;
  toggleGroup: (ids: string[]) => void;
  toggleCollapse: (key: string) => void;
  superRegionIds: (sr: SuperRegionNode) => string[];
}

export const HierarchyList = ({
  isLoading,
  visibleHierarchy,
  localSelected,
  lockedIds,
  collapsed,
  toggle,
  toggleGroup,
  toggleCollapse,
  superRegionIds,
}: HierarchyListProps) => (
  <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
    {isLoading ? (
      <p className="text-xs text-celery-600 text-center py-4">Loading…</p>
    ) : (
      <>
        {visibleHierarchy.directors.map((user) => (
          <div key={user._id} className="flex items-center gap-2 px-2">
            <Crown className="size-3 text-gold-400 shrink-0" />
            <UserRow
              user={user}
              isSelected={localSelected.includes(user._id)}
              onToggle={toggle}
              isLocked={lockedIds.includes(user._id)}
            />
          </div>
        ))}

        {visibleHierarchy.superRegions.map((sr) => {
          const srIds = superRegionIds(sr);
          const allSrSelected = srIds.every((id) => localSelected.includes(id));
          const someSrSelected = !allSrSelected && srIds.some((id) => localSelected.includes(id));
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
                  {sr.users.map((user) => (
                    <UserRow
                      key={user._id}
                      user={user}
                      isSelected={localSelected.includes(user._id)}
                      onToggle={toggle}
                      isLocked={lockedIds.includes(user._id)}
                    />
                  ))}
                  {sr.subRegions.map((sub) => {
                    const subIds = sub.users.map((u) => u._id);
                    const allSubSelected = subIds.every((id) => localSelected.includes(id));
                    const someSubSelected = !allSubSelected && subIds.some((id) => localSelected.includes(id));
                    const isSubCollapsed = collapsed.has(sub.prefix);
                    return (
                      <div key={sub.prefix} className="flex flex-col gap-1">
                        <GroupHeader
                          label={`${sub.name} (${sub.prefix})`}
                          allSelected={allSubSelected}
                          someSelected={someSubSelected}
                          onToggleAll={() => toggleGroup(subIds)}
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
                                isLocked={lockedIds.includes(user._id)}
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

        {visibleHierarchy.directors.length === 0 && visibleHierarchy.superRegions.length === 0 ? (
          <p className="text-xs text-celery-600 text-center py-4">No users found.</p>
        ) : null}
      </>
    )}
  </div>
);
