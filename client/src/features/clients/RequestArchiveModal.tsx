import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Client } from "@/types";
import { useRequestArchive } from "./hooks/useArchive";

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
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (!client) reset({ reason: "" });
  }, [client, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!client) return;
    await requestArchive.mutateAsync({ clientId: client._id, reason: values.reason });
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={client !== null}
      onClose={onClose}
      title="Request archive"
      size="sm"
      disableOutsideClick
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <div className="p-3 rounded-lg bg-bg-base border border-celery-700 mb-2">
            <span className="text-xs text-celery-600">Client</span>
            <p className="text-sm text-celery-200 font-medium">{client?.companyName}</p>
          </div>
          <label className="text-xs text-celery-500">Reason for archiving</label>
          <textarea
            {...register("reason")}
            rows={3}
            placeholder="Explain why this client should be archived..."
            className={cn(
              "w-full rounded-lg bg-bg-elevated border border-celery-700",
              "px-3 py-2 text-sm text-celery-200 resize-none",
              "focus:outline-none focus:border-celery-500",
            )}
          />
          <FieldError message={errors.reason?.message} />
        </div>

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
