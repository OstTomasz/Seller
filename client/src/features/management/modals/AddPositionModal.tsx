import { useState } from "react";
import { Modal, Button, Input } from "@/components/ui";
import { useCreatePosition } from "../hooks/useManagementStructure";
import { toast } from "sonner";

interface Props {
  region: { id: string; name: string; prefix: string } | null;
  onClose: () => void;
}

export const AddPositionModal = ({ region, onClose }: Props) => {
  const [code, setCode] = useState("");
  const { mutate, isPending } = useCreatePosition();

  const suggestedCode = region ? `${region.prefix}-2` : "";

  const handleSubmit = () => {
    if (!region || !code.trim()) return;
    mutate(
      { regionId: region.id, code: code.trim().toUpperCase() },
      {
        onSuccess: () => {
          toast.success("Position created");
          onClose();
          setCode("");
        },
        onError: (e: unknown) => {
          const msg = (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message;
          toast.error(msg ?? "Failed to create position");
        },
      },
    );
  };

  return (
    <Modal isOpen={!!region} onClose={onClose} title="Add position" size="sm">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-celery-400">
          Region: <span className="text-celery-200 font-medium">{region?.name}</span>
        </p>
        <Input
          label="Position code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={suggestedCode}
        />
        <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!code.trim() || isPending}>
            {isPending ? "Creating…" : "Create"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
