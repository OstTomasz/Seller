import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, ConfirmDialog } from "@/components/ui";
import type { Client } from "@/types";
import { useUnarchiveClient } from "@/features/clients/hooks/useArchive";
import { useConfirm } from "@/hooks/useConfirm";
import { ArchiveReasonFields } from "@/features/clients/modals/ArchiveReasonForm.sections";
import {
  archiveReasonSchema,
  type ArchiveReasonFormValues,
} from "@/features/clients/modals/archiveReason.schema";

interface UnarchiveModalProps {
  client: Client | null;
  onClose: () => void;
}

export const UnarchiveModal = ({ client, onClose }: UnarchiveModalProps) => {
  const unarchive = useUnarchiveClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ArchiveReasonFormValues>({
    resolver: zodResolver(archiveReasonSchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (!client) reset({ reason: "" });
  }, [client, reset]);

  const confirmUnarchive = useConfirm<ArchiveReasonFormValues>(async (values) => {
    if (!client) return;
    await unarchive.mutateAsync({ clientId: client._id, reason: values.reason });
    reset();
    onClose();
  });

  const onSubmit = (values: ArchiveReasonFormValues) => confirmUnarchive.ask(values);

  return (
    <>
      <Modal isOpen={client !== null} onClose={onClose} title="Unarchive client" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <ArchiveReasonFields
            clientName={client?.companyName}
            label="Reason for unarchiving"
            placeholder="Explain why this client is being unarchived..."
            error={errors.reason?.message}
            textareaProps={register("reason")}
          />

          <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
            <Button type="button" variant="ghost" onClick={onClose} disabled={unarchive.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={unarchive.isPending}>
              {unarchive.isPending ? "Unarchiving..." : "Unarchive client"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmUnarchive.isOpen}
        onClose={confirmUnarchive.cancel}
        onConfirm={confirmUnarchive.confirm}
        title="Unarchive client?"
        description={`This will restore ${client?.companyName} to active clients.`}
        confirmLabel="Unarchive"
        isLoading={unarchive.isPending}
      />
    </>
  );
};
