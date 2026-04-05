import { useEffect, useState } from "react";
import { Modal, Button, Select, Input, ConfirmDialog } from "@/components/ui";
import {
  useAssignUser,
  useRemoveFromPosition,
  useUpdatePositionCode,
  useDeletePosition,
} from "../hooks/useManagementStructure";
import type { UserForInvite, PositionWithHolder } from "@/types";
import { toast } from "sonner";

interface Props {
  position: PositionWithHolder | null;
  availableUsers: UserForInvite[];
  onClose: () => void;
}

/** Unified position management modal: edit code, assign/remove user, delete vacant position */
export const EditPositionModal = ({ position, availableUsers, onClose }: Props) => {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [code, setCode] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { mutate: assignUser, isPending: isAssigning } = useAssignUser();
  const { mutate: removeFromPos, isPending: isRemoving } = useRemoveFromPosition();
  const { mutate: updateCode, isPending: isUpdatingCode } = useUpdatePositionCode();
  const { mutate: deletePosition, isPending: isDeleting } = useDeletePosition();

  useEffect(() => {
    if (!position) {
      setSelectedUserId("");
      setCode("");
      setConfirmRemove(false);
      setConfirmDelete(false);
    } else {
      setCode(position.code);
    }
  }, [position]);

  const isPending = isRemoving || isAssigning || isUpdatingCode || isDeleting;
  const holder = position?.currentHolder ?? null;
  const codeChanged = code.trim().toUpperCase() !== position?.code;

  const handleUpdateCode = () => {
    if (!position || !codeChanged) return;
    updateCode(
      { id: position._id, code: code.trim().toUpperCase() },
      {
        onSuccess: () => {
          toast.success("Code updated");
          onClose();
        },
        onError: () => toast.error("Failed to update code"),
      },
    );
  };

  const handleAssign = () => {
    if (!position || !selectedUserId) return;
    assignUser(
      { userId: selectedUserId, positionId: position._id },
      {
        onSuccess: () => {
          toast.success("User assigned");
          onClose();
        },
        onError: () => toast.error("Failed to assign user"),
      },
    );
  };

  const handleRemoveConfirmed = () => {
    if (!holder) return;
    removeFromPos(holder._id, {
      onSuccess: () => {
        toast.success("User removed from position");
        setConfirmRemove(false);
        onClose();
      },
      onError: () => toast.error("Failed to remove user"),
    });
  };

  const handleDeleteConfirmed = () => {
    if (!position) return;
    deletePosition(position._id, {
      onSuccess: () => {
        toast.success("Position deleted");
        setConfirmDelete(false);
        onClose();
      },
      onError: (e: unknown) => {
        const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(msg ?? "Failed to delete position");
      },
    });
  };

  return (
    <>
      <Modal isOpen={!!position} onClose={onClose} title="Manage position" size="sm">
        <div className="flex flex-col gap-5">
          {/* ── Position code ─────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-celery-500 uppercase tracking-wider">
              Position code
            </p>
            <div className="flex gap-2 *:flex-1">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. ADV-WAR-1"
                className="h-9"
              />
              <Button
                onClick={handleUpdateCode}
                disabled={!codeChanged || !code.trim() || isUpdatingCode}
                className="h-9"
              >
                {isUpdatingCode ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          <div className="border-t border-celery-700" />

          {/* ── User section ──────────────────────────────────── */}
          {holder ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-celery-500 uppercase tracking-wider">
                Current holder
              </p>
              <Button
                variant="danger"
                onClick={() => setConfirmRemove(true)}
                disabled={isPending}
                className="w-full justify-center"
              >
                Remove {holder.firstName} {holder.lastName} from position
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-celery-500 uppercase tracking-wider">
                Assign user
              </p>
              <Select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                placeholder="Select user…"
                options={availableUsers.map((u) => ({
                  value: u._id,
                  label: `${u.firstName} ${u.lastName} #${u.numericId}`,
                }))}
              />
              <div className="flex flex-col gap-2 pt-2 border-t border-celery-700">
                <Button
                  onClick={handleAssign}
                  disabled={!selectedUserId || isAssigning}
                  className="w-full justify-center"
                >
                  {isAssigning ? "Assigning…" : "Assign"}
                </Button>
                {position?.type === "salesperson" ? (
                  <Button
                    variant="danger"
                    onClick={() => setConfirmDelete(true)}
                    disabled={isPending}
                    className="w-full justify-center"
                  >
                    Delete position
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={handleRemoveConfirmed}
        title="Remove from position?"
        description={`${holder?.firstName} ${holder?.lastName} will be removed from ${position?.code} but remain active.`}
        confirmLabel="Remove"
        isLoading={isRemoving}
      />

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteConfirmed}
        title="Delete position?"
        description={`Delete position ${position?.code}? This cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </>
  );
};
