import { Modal, Button, ConfirmDialog } from "@/components/ui";
import { useConfirm } from "@/hooks/useConfirm";
import type { ArchivedUser } from "@/types";
import { useUnarchiveUser } from "./hooks/useArchivedUsers";

interface Props {
  user: ArchivedUser | null;
  onClose: () => void;
}

/** Modal for unarchiving a user — director only. */
export const UnarchiveUserModal = ({ user, onClose }: Props) => {
  const { mutateAsync, isPending } = useUnarchiveUser();

  const { isOpen, ask, confirm, cancel } = useConfirm<string>(async (id) => {
    await mutateAsync(id);
    onClose();
  });

  return (
    <>
      <Modal isOpen={user !== null} onClose={onClose} title="Unarchive user" size="sm">
        <div className="flex flex-col gap-6">
          <div className="p-3 rounded-lg bg-bg-base border border-celery-700">
            <span className="text-xs text-celery-600">User</span>
            <p className="text-sm text-celery-200 font-medium">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-celery-500">{user?.email}</p>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
            <Button variant="ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={() => user && ask(user._id)} disabled={isPending}>
              {isPending ? "Unarchiving…" : "Unarchive user"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={cancel}
        onConfirm={confirm}
        title="Unarchive user?"
        description={`This will restore ${user?.firstName} ${user?.lastName} to active users.`}
        confirmLabel="Unarchive"
        isLoading={isPending}
      />
    </>
  );
};
