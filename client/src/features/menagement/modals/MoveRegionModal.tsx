import { useState } from "react";
import { Modal, Button, Select } from "@/components/ui";
import { useMoveRegion } from "../hooks/useManagementStructure";
import type { Region } from "@/types";
import { toast } from "sonner";

interface Props {
  region: { id: string; name: string } | null;
  superregions: Region[];
  onClose: () => void;
}

export const MoveRegionModal = ({ region, superregions, onClose }: Props) => {
  const [selected, setSelected] = useState("");
  const { mutate, isPending } = useMoveRegion();

  const handleSubmit = () => {
    if (!region || !selected) return;
    mutate(
      { id: region.id, newParentId: selected },
      {
        onSuccess: () => {
          toast.success("Region moved");
          onClose();
        },
        onError: () => toast.error("Failed to move region"),
      },
    );
  };

  return (
    <Modal isOpen={!!region} onClose={onClose} title="Move region" size="sm">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-celery-400">
          Moving: <span className="text-celery-200 font-medium">{region?.name}</span>
        </p>
        <Select
          label="Target superregion"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          placeholder="Select superregion…"
          options={superregions
            .filter((sr) => sr.parentRegion === null)
            .map((sr) => ({ value: sr._id, label: sr.name }))}
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
