// client/src/features/archive/UnarchiveModal.tsx

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, Button, ConfirmDialog } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Client } from "@/types";
import { useUnarchiveClient } from "@/features/clients/hooks/useArchive";
import { useConfirm } from "@/hooks/useConfirm";

const schema = z.object({
  reason: z.string().min(1, "Reason is required").min(10, "Please provide more detail"),
});
type FormValues = z.infer<typeof schema>;

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <span className="min-h-4 text-xs text-red-400">{message}</span>
  ) : (
    <span className="min-h-4" />
  );

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
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (!client) reset({ reason: "" });
  }, [client, reset]);

  const confirmUnarchive = useConfirm<FormValues>(async (values) => {
    if (!client) return;
    await unarchive.mutateAsync({ clientId: client._id, reason: values.reason });
    reset();
    onClose();
  });

  const onSubmit = (values: FormValues) => confirmUnarchive.ask(values);

  return (
    <>
      <Modal
        isOpen={client !== null}
        onClose={onClose}
        title="Unarchive client"
        size="sm"
        disableOutsideClick
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <div className="p-3 rounded-lg bg-bg-base border border-celery-700 mb-2">
              <span className="text-xs text-celery-600">Client</span>
              <p className="text-sm text-celery-200 font-medium">{client?.companyName}</p>
            </div>
            <label className="text-xs text-celery-500">Reason for unarchiving</label>
            <textarea
              {...register("reason")}
              rows={3}
              placeholder="Explain why this client is being unarchived..."
              className={cn(
                "w-full rounded-lg bg-bg-elevated border border-celery-700",
                "px-3 py-2 text-sm text-celery-200 resize-none",
                "focus:outline-none focus:border-celery-500",
              )}
            />
            <FieldError message={errors.reason?.message} />
          </div>

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
