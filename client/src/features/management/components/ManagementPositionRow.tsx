import { Pencil } from "lucide-react";
import type { PositionWithHolder } from "@/types";
import { ManagementActionBtn } from "./ManagementActionBtn";

interface Props {
  position: PositionWithHolder;
  canEdit: boolean;
  onEditPosition: (p: PositionWithHolder) => void;
  onEditUser: (userId: string) => void;
}

/** Single position row in the management structure tree */
export const ManagementPositionRow = ({ position, canEdit, onEditPosition, onEditUser }: Props) => (
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
      <ManagementActionBtn
        icon={Pencil}
        onClick={() => onEditPosition(position)}
        title="Manage position"
      />
    ) : null}
  </div>
);
