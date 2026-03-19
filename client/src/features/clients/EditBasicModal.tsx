import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, Input, Button, ConfirmDialog } from "@/components/ui";
import type { Client } from "@/types";
import { useUpdateClientBasic } from "./hooks/useUpdateClient";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";

const schema = z.object({
  companyName: z.string().min(1, "Required"),
  nip: z
    .string()
    .min(1, "Required")
    .regex(/^\d{10}$/, "NIP must be exactly 10 digits"),
});

type FormValues = z.infer<typeof schema>;

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <span className="min-h-4 text-xs text-red-400">{message}</span>
  ) : (
    <span className="min-h-4" />
  );

interface EditBasicModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
}

export const EditBasicModal = ({ isOpen, onClose, client }: EditBasicModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: client.companyName,
      nip: client.nip ?? "",
    },
  });

  useEffect(() => {
    reset({ companyName: client.companyName, nip: client.nip ?? "" });
  }, [client, reset]);

  const updateBasic = useUpdateClientBasic(client._id);

  const discard = useDiscardConfirm(isDirty, () => {
    reset();
    onClose();
  });

  const onSubmit = async (values: FormValues) => {
    const basicChanged =
      values.companyName !== client.companyName || (values.nip || null) !== client.nip;

    if (basicChanged) {
      await updateBasic.mutateAsync({
        companyName: values.companyName,
        nip: values.nip || null,
      });
    }
    reset(values);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={discard.tryClose}
        disableOutsideClick={true}
        title="Edit basic info"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-celery-500">Company name</label>
              <Input {...register("companyName")} placeholder="Company name" />
              <FieldError message={errors.companyName?.message} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-celery-500">NIP</label>
              <Input {...register("nip")} placeholder="0000000000" />
              <FieldError message={errors.nip?.message} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
            <Button
              type="button"
              variant="ghost"
              onClick={discard.tryClose}
              disabled={updateBasic.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateBasic.isPending || !isDirty}>
              {updateBasic.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        isOpen={discard.isOpen}
        onClose={discard.cancel}
        onConfirm={discard.confirm}
        title="Discard changes?"
        description="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard"
      />
    </>
  );
};
