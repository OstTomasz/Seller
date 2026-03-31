// client/src/features/menagement/modals/AssignUserModal.tsx
import { useEffect, useState } from "react";
import { Modal, Button, Select, ConfirmDialog } from "@/components/ui";
import { Textarea } from "@/components/ui";
import { useAssignUser, useRemoveFromPosition } from "../hooks/useManagementStructure";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/api/users";
import type { UserForInvite } from "@/types";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  position: { _id: string; code: string; currentHolder: UserForInvite | null } | null;
  availableUsers: UserForInvite[];
  onClose: () => void;
}

type ConfirmAction = "remove" | "archive" | null;

// ── Hook ──────────────────────────────────────────────────────────────────────

const useArchiveUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      usersApi.archiveUser(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-positions"] });
      qc.invalidateQueries({ queryKey: ["management-users"] });
      qc.invalidateQueries({ queryKey: ["archived-users"] });
      qc.invalidateQueries({ queryKey: ["users-without-position"] });
      qc.invalidateQueries({ queryKey: ["company-structure"] });
    },
  });
};

// ── Component ─────────────────────────────────────────────────────────────────

export const AssignUserModal = ({ position, availableUsers, onClose }: Props) => {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [archiveReason, setArchiveReason] = useState("");

  const { mutate: assignUser, isPending: isAssigning } = useAssignUser();
  const { mutate: removeFromPos, isPending: isRemoving } = useRemoveFromPosition();
  const { mutate: archiveUser, isPending: isArchiving } = useArchiveUser();

  useEffect(() => {
    if (!position) {
      setSelectedUserId("");
      setConfirmAction(null);
      setArchiveReason("");
    }
  }, [position]);

  const isPending = isRemoving || isArchiving || isAssigning;

  const handleRemoveConfirmed = () => {
    if (!position?.currentHolder) return;
    removeFromPos(position.currentHolder._id, {
      onSuccess: () => {
        toast.success("User removed from position");
        setConfirmAction(null);
        onClose();
      },
      onError: () => toast.error("Failed to remove user"),
    });
  };

  const handleArchiveConfirmed = () => {
    if (!position?.currentHolder || !archiveReason.trim()) return;
    archiveUser(
      { id: position.currentHolder._id, reason: archiveReason.trim() },
      {
        onSuccess: () => {
          toast.success("User archived");
          setConfirmAction(null);
          onClose();
        },
        onError: (e: unknown) => {
          const msg = (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message;
          toast.error(msg ?? "Failed to archive user");
        },
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

  return (
    <>
      <Modal
        isOpen={!!position && !confirmAction}
        onClose={onClose}
        title="Manage position"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-celery-400">
            Position: <span className="text-celery-200 font-medium">{position?.code}</span>
          </p>

          {position?.currentHolder ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-celery-300">
                Current holder:{" "}
                <span className="text-celery-100 font-medium">
                  {position.currentHolder.firstName} {position.currentHolder.lastName}
                </span>
              </p>
              <div className="flex flex-col gap-2 pt-2 border-t border-celery-700">
                <Button
                  variant="ghost"
                  onClick={() => setConfirmAction("remove")}
                  disabled={isPending}
                  className="w-full justify-center"
                >
                  Remove from position (keep active)
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setConfirmAction("archive")}
                  disabled={isPending}
                  className="w-full justify-center"
                >
                  Remove & archive user
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Select
                label="Assign user"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                placeholder="Select user…"
                options={availableUsers.map((u) => ({
                  value: u._id,
                  label: `${u.firstName} ${u.lastName} #${u.numericId}`,
                }))}
              />
              <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleAssign} disabled={!selectedUserId || isAssigning}>
                  {isAssigning ? "Assigning…" : "Assign"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Confirm remove from position */}
      <ConfirmDialog
        isOpen={confirmAction === "remove"}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleRemoveConfirmed}
        title="Remove from position?"
        description={`${position?.currentHolder?.firstName} ${position?.currentHolder?.lastName} will be removed from ${position?.code} but remain active.`}
        confirmLabel="Remove"
        isLoading={isRemoving}
      />

      {/* Confirm archive — with reason input */}
      <Modal
        isOpen={confirmAction === "archive"}
        onClose={() => setConfirmAction(null)}
        title="Archive user"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-celery-300">
            Archiving{" "}
            <span className="font-semibold text-celery-100">
              {position?.currentHolder?.firstName} {position?.currentHolder?.lastName}
            </span>
            . This will remove them from{" "}
            <span className="font-semibold text-celery-100">{position?.code}</span> and mark as
            archived.
          </p>
          <Textarea
            label="Reason (required)"
            value={archiveReason}
            onChange={(e) => setArchiveReason(e.target.value)}
            placeholder="Enter reason for archiving…"
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
            <Button variant="ghost" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleArchiveConfirmed}
              disabled={!archiveReason.trim() || isArchiving}
            >
              {isArchiving ? "Archiving…" : "Archive user"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
