import { useState, useEffect } from "react";
import { Modal, Button, Input } from "@/components/ui";
import { useUpdateRegionName } from "../hooks/useManagementStructure";
import { toast } from "sonner";

interface Props {
  region: { id: string; name: string; prefix: string } | null;
  onClose: () => void;
}

export const EditRegionModal = ({ region, onClose }: Props) => {
  const [name, setName] = useState("");
  const { mutate, isPending } = useUpdateRegionName();

  useEffect(() => {
    if (region) setName(region.name);
  }, [region]);

  const handleSubmit = () => {
    if (!region || !name.trim()) return;
    mutate(
      { id: region.id, name: name.trim() },
      {
        onSuccess: () => {
          toast.success("Region updated");
          onClose();
        },
        onError: () => toast.error("Failed to update region"),
      },
    );
  };

  return (
    <Modal isOpen={!!region} onClose={onClose} title="Edit region" size="sm">
      <div className="flex flex-col gap-4">
        <Input label="Region name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
