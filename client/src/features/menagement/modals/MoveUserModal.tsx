import { useState } from "react";
import { Modal, Button, Select } from "@/components/ui";
import { useAssignUser } from "../hooks/useManagementStructure";
import { toast } from "sonner";

interface IPosition {
  _id: string;
  code: string;
  regionId: string;
}

interface Props {
  user: { _id: string; firstName: string; lastName: string; numericId: number } | null;
  availablePositions: IPosition[];
  onClose: () => void;
}

export const MoveUserModal = ({ user, availablePositions, onClose }: Props) => {
  const [selected, setSelected] = useState("");
  const { mutate, isPending } = useAssignUser();

  const handleSubmit = () => {
    if (!user || !selected) return;
    mutate(
      { userId: user._id, positionId: selected },
      {
        onSuccess: () => {
          toast.success("User moved");
          onClose();
        },
        onError: () => toast.error("Failed to move user"),
      },
    );
  };

  return (
    <Modal isOpen={!!user} onClose={onClose} title="Move user" size="sm">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-celery-400">
          User:{" "}
          <span className="text-celery-200 font-medium">
            {user?.firstName} {user?.lastName}
          </span>
        </p>
        <Select
          label="Target position"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          placeholder="Select position…"
          options={availablePositions.map((p) => ({ value: p._id, label: p.code }))}
        />
        <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selected || isPending}>
            {isPending ? "Moving…" : "Move"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
