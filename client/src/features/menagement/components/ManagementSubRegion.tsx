import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import type { PositionWithHolder } from "@/types";
import { ManagementActionBtn } from "./ManagementActionBtn";
import { ManagementPositionRow } from "./ManagementPositionRow";
import { SubRegionNode } from "../types/menagement";

interface Props {
  node: SubRegionNode;
  collapsed: boolean;
  onToggle: () => void;
  canEdit: boolean;
  onAddPosition: (r: { id: string; name: string; prefix: string }) => void;
  onEditUser: (userId: string) => void;
  onEditPosition: (p: PositionWithHolder) => void;
}

/** Collapsible subregion section with positions list */
export const ManagementSubRegion = ({
  node,
  collapsed,
  onToggle,
  canEdit,
  onAddPosition,
  onEditUser,
  onEditPosition,
}: Props) => (
  <div className="flex flex-col gap-1 ml-4">
    <div className="flex items-center gap-2 px-2 py-1 w-full rounded text-xs font-semibold text-celery-500 uppercase tracking-wider">
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
        <ManagementActionBtn
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
          <ManagementPositionRow
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
