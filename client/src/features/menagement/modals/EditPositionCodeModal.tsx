import { useState } from "react";
import { Modal, Input, Button } from "@/components/ui";
import { toast } from "sonner";
import { useUpdatePositionCode } from "../hooks/useManagementStructure";

interface Props {
  position: { id: string; code: string } | null;
  onClose: () => void;
}

/** Modal for changing a position's code (e.g. adv-war-1 → adv-war-2) */
export const EditPositionCodeModal = ({ position, onClose }: Props) => {
  const [code, setCode] = useState(position?.code ?? "");
  const { mutate, isPending } = useUpdatePositionCode();

  const handleSubmit = () => {
    if (!position || !code.trim()) return;
    mutate(
      { id: position.id, code: code.trim().toUpperCase() },
      {
        onSuccess: () => {
          toast.success("Position code updated");
          onClose();
        },
        onError: (e: unknown) => {
          const msg = e instanceof Error ? e.message : null;
          toast.error(msg ?? "Failed to update code");
        },
      },
    );
  };

  return (
    <Modal isOpen={!!position} onClose={onClose} title="Edit position code" size="sm">
      <div className="flex flex-col gap-4">
        <Input
          label="Position code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. ADV-WAR-1"
        />
        <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!code.trim() || isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
