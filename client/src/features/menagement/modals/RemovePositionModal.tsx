import { Modal, Button } from "@/components/ui";
import { useDeletePosition } from "../hooks/useManagementStructure";
import { toast } from "sonner";

interface Props {
  position: { id: string; code: string } | null;
  onClose: () => void;
}

export const RemovePositionModal = ({ position, onClose }: Props) => {
  const { mutate, isPending } = useDeletePosition();

  const handleConfirm = () => {
    if (!position) return;
    mutate(position.id, {
      onSuccess: () => {
        toast.success("Position removed");
        onClose();
      },
      onError: (e: unknown) => {
        const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(msg ?? "Failed to remove position");
      },
    });
  };

  return (
    <Modal isOpen={!!position} onClose={onClose} title="Remove position" size="sm">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-celery-300">
          Are you sure you want to remove position{" "}
          <span className="font-semibold text-celery-100">{position?.code}</span>? This action
          cannot be undone.
        </p>
        <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Removing…" : "Remove"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
