import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, ConfirmDialog } from "@/components/ui";
import type { Client, UserRole } from "@/types";
import { useDirectArchive } from "../hooks/useArchive";
import { useConfirm } from "@/hooks/useConfirm";
import { ArchiveReasonFields } from "./ArchiveReasonForm.sections";
import { archiveReasonSchema, type ArchiveReasonFormValues } from "./archiveReason.schema";

interface DirectArchiveModalProps {
  client: Client | null;
  onClose: () => void;
  userRole: UserRole;
}

export const DirectArchiveModal = ({ client, onClose, userRole }: DirectArchiveModalProps) => {
  const directArchive = useDirectArchive();

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

  const confirmArchive = useConfirm<ArchiveReasonFormValues>(async (values) => {
    if (!client) return;
    await directArchive.mutateAsync({ clientId: client._id, reason: values.reason });
    reset();
    onClose();
  });

  const onSubmit = (values: ArchiveReasonFormValues) => {
    confirmArchive.ask(values);
  };

  return (
    <>
      <Modal isOpen={client !== null} onClose={onClose} title="Archive client" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <ArchiveReasonFields
            clientName={client?.companyName}
            label="Reason for archiving"
            placeholder="Explain why this client is being archived..."
            error={errors.reason?.message}
            textareaProps={register("reason")}
          />

          <p className="text-xs text-celery-600">
            {userRole === "director"
              ? "As director you can archive clients directly."
              : "As deputy you can archive clients in your superregion directly."}
          </p>

          <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={directArchive.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={directArchive.isPending}>
              Archive client
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmArchive.isOpen}
        onClose={confirmArchive.cancel}
        onConfirm={confirmArchive.confirm}
        title="Archive client?"
        description={`This will archive ${client?.companyName}. The client will be removed from active lists and moved to the archive.`}
        confirmLabel="Archive"
        isLoading={directArchive.isPending}
      />
    </>
  );
};
