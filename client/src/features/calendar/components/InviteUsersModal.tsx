import { useEffect } from "react";
import { Search } from "lucide-react";
import { Modal, Button, Input, ConfirmDialog } from "@/components/ui";
import { useUsersForInvite } from "../hooks/useUsersForInvite";
import type { UserForInvite } from "@/types";
import { useInviteSelection } from "./InviteUsersModal.hooks";
import { HierarchyList } from "./InviteUsersModal.list";

// ── Props ─────────────────────────────────────────────────────────────────────

interface InviteUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
  excludeUserId?: string;
  lockedIds?: string[];
  allowedIds?: string[];
  allUsersForHierarchy?: UserForInvite[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export const InviteUsersModal = ({
  isOpen,
  onClose,
  selectedIds,
  onConfirm,
  excludeUserId,
  lockedIds = [],
  allowedIds,
}: InviteUsersModalProps) => {
  const { data: users = [], isLoading } = useUsersForInvite();
  const {
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
  } = useInviteSelection({ users, selectedIds, excludeUserId, allowedIds, lockedIds });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) resetFromProps();
      if (!isOpen) setDiscardOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen, resetFromProps, setDiscardOpen]);

  const handleConfirm = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    onConfirm(localSelected);
    onClose();
  };

  const handleClose = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (isDirty) {
      setDiscardOpen(true);
    } else {
      setLocalSelected(selectedIds);
      onClose();
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !discardOpen}
        onClose={handleClose}
        title="Invite participants"
        size="md"
      >
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-celery-500" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder="Search by name, ID or code…"
              className="pl-9"
            />
          </div>

          {localSelected.length > 0 ? (
            <p className="text-xs text-celery-500">
              {localSelected.length} participant{localSelected.length > 1 ? "s" : ""} selected
            </p>
          ) : null}

          <HierarchyList
            isLoading={isLoading}
            visibleHierarchy={visibleHierarchy}
            localSelected={localSelected}
            lockedIds={lockedIds}
            collapsed={collapsed}
            toggle={toggle}
            toggleGroup={toggleGroup}
            toggleCollapse={toggleCollapse}
            superRegionIds={superRegionIds}
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={localSelected.length === 0}>
              {localSelected.length > 0
                ? `Invite ${localSelected.length} participant${localSelected.length > 1 ? "s" : ""}`
                : "Confirm"}
            </Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        isOpen={discardOpen}
        onClose={() => setDiscardOpen(false)}
        onConfirm={() => {
          setDiscardOpen(false);
          setLocalSelected(selectedIds);
          onClose();
        }}
        title="Discard selection?"
        description="You have unsaved participant changes. Discard them?"
        confirmLabel="Discard"
      />
    </>
  );
};
