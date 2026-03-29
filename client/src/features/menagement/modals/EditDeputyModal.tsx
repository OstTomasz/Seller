import { useState, useEffect } from "react";
import { Modal, Button, Select } from "@/components/ui";
import { useUpdateDeputy } from "../hooks/useManagementStructure";
import type { UserForInvite } from "@/types";
import { toast } from "sonner";

interface Props {
  superregion: { id: string; name: string } | null;
  deputies: UserForInvite[];
  currentDeputyId?: string;
  onClose: () => void;
}

export const EditDeputyModal = ({ superregion, deputies, currentDeputyId, onClose }: Props) => {
  const [selected, setSelected] = useState(currentDeputyId ?? "");
  const { mutate, isPending } = useUpdateDeputy();

  useEffect(() => {
    setSelected(currentDeputyId ?? "");
  }, [currentDeputyId]);

  const handleSubmit = () => {
    if (!superregion) return;
    mutate(
      { id: superregion.id, deputyId: selected || null },
      {
        onSuccess: () => {
          toast.success("Deputy updated");
          onClose();
        },
        onError: () => toast.error("Failed to update deputy"),
      },
    );
  };

  return (
    <Modal isOpen={!!superregion} onClose={onClose} title="Change deputy" size="sm">
      <div className="flex flex-col gap-4">
        <Select
          label="Deputy"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          placeholder="— No deputy —"
          options={deputies.map((u) => ({
            value: u._id,
            label: `${u.firstName} ${u.lastName} #${u.numericId}`,
          }))}
        />
        <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
