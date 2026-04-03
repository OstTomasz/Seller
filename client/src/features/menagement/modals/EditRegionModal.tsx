import { useState, useEffect } from "react";
import { Modal, Button, Input } from "@/components/ui";
import { useUpdateRegionName, useUpdateRegionPrefix } from "../hooks/useManagementStructure";

interface Props {
  region: { id: string; name: string; prefix: string } | null;
  onClose: () => void;
}

export const EditRegionModal = ({ region, onClose }: Props) => {
  const { mutate: mutateName, isPending: isPendingName } = useUpdateRegionName();
  const { mutate: mutatePrefix, isPending: isPendingPrefix } = useUpdateRegionPrefix();
  const isPending = isPendingName || isPendingPrefix;

  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState("");

  useEffect(() => {
    if (region) {
      setName(region.name);
      setPrefix(region.prefix);
    }
  }, [region]);

  const handleSubmit = () => {
    if (!region) return;
    if (name.trim() !== region.name) mutateName({ id: region.id, name: name.trim() });
    if (prefix.trim().toUpperCase() !== region.prefix)
      mutatePrefix({ id: region.id, prefix: prefix.trim().toUpperCase() });
    onClose();
  };

  return (
    <Modal isOpen={!!region} onClose={onClose} title="Edit region" size="sm">
      <div className="flex flex-col gap-4">
        <Input label="Region name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label="Region prefix"
          value={prefix}
          onChange={(e) => setPrefix(e.target.value.toUpperCase())}
          maxLength={5}
        />
        <Button onClick={handleSubmit} disabled={(!name.trim() && !prefix.trim()) || isPending}>
          Save
        </Button>
        <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !prefix.trim() || isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
