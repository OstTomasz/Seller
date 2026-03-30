import { useState, useEffect } from "react";
import { Modal, Button, Select } from "@/components/ui";
import { useUpdateDeputy } from "../hooks/useManagementStructure";
import { toast } from "sonner";
import { UserForInvite } from "@/types";

interface Props {
  superregion: { id: string; name: string } | null;
  allUsers: UserForInvite[];
  onClose: () => void;
}

export const EditDeputyModal = ({ superregion, allUsers, onClose }: Props) => {
  const [selected, setSelected] = useState("");
  const { mutate, isPending } = useUpdateDeputy();

  useEffect(() => {
    if (!superregion) setSelected("");
  }, [superregion]);

  const availableDeputies = allUsers.filter((u) => !u.position);

  const handleSubmit = () => {
    if (!superregion) return;
    mutate(
      { id: superregion.id, deputyId: selected || null },
      {
        onSuccess: () => {
          toast.success("Deputy updated");
          onClose();
        },
        onError: (e: unknown) => {
          const msg = (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message;
          toast.error(msg ?? "Failed to update deputy");
        },
      },
    );
  };

  return (
    <Modal isOpen={!!superregion} onClose={onClose} title="Change deputy" size="sm">
      <div className="flex flex-col gap-4">
        {availableDeputies.length === 0 ? (
          <p className="text-sm text-celery-500">No available deputies without a position.</p>
        ) : (
          <Select
            label="Deputy"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            placeholder="— Select deputy —"
            options={availableDeputies.map((u) => ({
              value: u._id,
              label: `${u.firstName} ${u.lastName} #${u.numericId}`,
            }))}
          />
        )}
        <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !selected}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
