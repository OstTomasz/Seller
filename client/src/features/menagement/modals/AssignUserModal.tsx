import { useEffect, useState } from "react";
import { Modal, Button, Select } from "@/components/ui";
import {
  useAssignUser,
  useRemoveFromPosition,
  useDeactivateUser,
} from "../hooks/useManagementStructure";
import type { UserForInvite } from "@/types";
import { toast } from "sonner";

interface Props {
  position: { _id: string; code: string; currentHolder: UserForInvite | null } | null;
  availableUsers: UserForInvite[];
  onClose: () => void;
}

export const AssignUserModal = ({ position, availableUsers, onClose }: Props) => {
  const [selectedUserId, setSelectedUserId] = useState("");
  const { mutate: assignUser, isPending: isAssigning } = useAssignUser();
  const { mutate: removeFromPos, isPending: isRemoving } = useRemoveFromPosition();
  const { mutate: deactivate, isPending: isDeactivating } = useDeactivateUser();

  useEffect(() => {
    if (!position) setSelectedUserId("");
  }, [position]);

  const handleRemoveFromPosition = () => {
    if (!position?.currentHolder) return;
    removeFromPos(position.currentHolder._id, {
      onSuccess: () => {
        toast.success("User removed from position");
        onClose();
      },
      onError: () => toast.error("Failed to remove user"),
    });
  };

  const handleDeactivate = () => {
    if (!position?.currentHolder) return;
    deactivate(position.currentHolder._id, {
      onSuccess: () => {
        toast.success("User deactivated");
        onClose();
      },
      onError: () => toast.error("Failed to deactivate user"),
    });
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
    <Modal isOpen={!!position} onClose={onClose} title="Manage position" size="sm">
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
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                onClick={handleRemoveFromPosition}
                disabled={isRemoving || isDeactivating}
                className="w-full justify-center text-celery-400 hover:text-celery-200"
              >
                {isRemoving ? "Removing…" : "Remove from position (keep active)"}
              </Button>
              <Button
                variant="danger"
                onClick={handleDeactivate}
                disabled={isRemoving || isDeactivating}
                className="w-full justify-center"
              >
                {isDeactivating ? "Deactivating…" : "Remove & deactivate user"}
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
  );
};
