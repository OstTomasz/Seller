import { Check, ChevronDown, ChevronRight, Lock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserForInvite } from "@/types";

interface UserRowProps {
  user: UserForInvite;
  isSelected: boolean;
  onToggle: (id: string) => void;
  isLocked?: boolean;
}

export const UserRow = ({ user, isSelected, onToggle, isLocked = false }: UserRowProps) => (
  <button
    type="button"
    onClick={() => !isLocked && onToggle(user._id)}
    className={cn(
      "flex items-center justify-between rounded-lg px-3 py-2 w-full",
      "text-sm transition-colors text-left",
      isLocked
        ? "bg-celery-900 text-celery-500 cursor-not-allowed opacity-70"
        : isSelected
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
      {isLocked ? (
        <Lock className="size-3 text-celery-600" />
      ) : isSelected ? (
        <Check className="size-3 text-celery-300" />
      ) : null}
    </span>
  </button>
);

interface GroupHeaderProps {
  label: string;
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: () => void;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  indent?: boolean;
}

export const GroupHeader = ({
  label,
  allSelected,
  someSelected,
  onToggleAll,
  collapsible = false,
  collapsed = false,
  onToggleCollapse,
  indent = false,
}: GroupHeaderProps) => (
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
