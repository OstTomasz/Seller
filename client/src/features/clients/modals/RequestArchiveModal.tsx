import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button } from "@/components/ui";
import type { Client } from "@/types";
import { useRequestArchive } from "../hooks/useArchive";
import { ArchiveReasonFields } from "./ArchiveReasonForm.sections";
import { archiveReasonSchema, type ArchiveReasonFormValues } from "./archiveReason.schema";

interface RequestArchiveModalProps {
  client: Client | null;
  onClose: () => void;
}

export const RequestArchiveModal = ({ client, onClose }: RequestArchiveModalProps) => {
  const requestArchive = useRequestArchive();

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

  const onSubmit = async (values: ArchiveReasonFormValues) => {
    if (!client) return;
    await requestArchive.mutateAsync({ clientId: client._id, reason: values.reason });
    reset();
    onClose();
  };

  return (
    <Modal isOpen={client !== null} onClose={onClose} title="Request archive" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <ArchiveReasonFields
          clientName={client?.companyName}
          label="Reason for archiving"
          placeholder="Explain why this client should be archived..."
          error={errors.reason?.message}
          textareaProps={register("reason")}
        />

        <p className="text-xs text-celery-600">Your request will be reviewed by your director.</p>

        <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={requestArchive.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={requestArchive.isPending}>
            {requestArchive.isPending ? "Sending..." : "Send request"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
