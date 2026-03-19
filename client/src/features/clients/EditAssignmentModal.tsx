import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { authApi } from "@/api/auth";
import { Modal, Button, ConfirmDialog, Input } from "@/components/ui";
import type { Client, UserRole } from "@/types";

import { useUpdateClientSalesperson } from "./hooks/useUpdateClient";
import { useConfirm } from "@/hooks/useConfirm";
import { useSalespersons } from "@/hooks/useSalespersons";

const schema = z.object({
  salespersonPositionId: z.string().min(1, "Select a salesperson"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <span className="min-h-4 text-xs text-red-400">{message}</span>
  ) : (
    <span className="min-h-4" />
  );

interface EditAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  userRole: UserRole;
}

export const EditAssignmentModal = ({
  isOpen,
  onClose,
  client,
  userRole,
}: EditAssignmentModalProps) => {
  const { data: salespersons = [], isLoading } = useSalespersons(userRole);
  const updateSalesperson = useUpdateClientSalesperson(client._id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      salespersonPositionId: client.assignedTo?._id ?? "",
      password: "",
    },
  });

  const confirmAssign = useConfirm<FormValues>(async (values) => {
    try {
      await authApi.verifyPassword(values.password);
    } catch {
      toast.error("Invalid password");
      return;
    }

    await updateSalesperson.mutateAsync(values.salespersonPositionId);
    reset({ salespersonPositionId: values.salespersonPositionId, password: "" });
    onClose();
  });

  const onSubmit = (values: FormValues) => {
    confirmAssign.ask(values);
  };

  const currentSalesperson = client.assignedTo?.currentHolder
    ? `${client.assignedTo.currentHolder.firstName} ${client.assignedTo.currentHolder.lastName}`
    : "—";

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Change salesperson" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {/* Current assignment info */}
          <div className="flex flex-col gap-1 p-3 rounded-lg bg-bg-base border border-celery-700">
            <span className="text-xs text-celery-600">Current salesperson</span>
            <span className="text-sm text-celery-300">{currentSalesperson}</span>
          </div>

          {/* Salesperson select */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-celery-500">New salesperson</label>
            {isLoading ? (
              <span className="text-xs text-celery-600">Loading...</span>
            ) : (
              <select
                {...register("salespersonPositionId")}
                className="w-full rounded-lg bg-bg-elevated border border-celery-700
                           px-3 py-2 text-sm text-celery-200
                           focus:outline-none focus:border-celery-500"
              >
                <option value="">Select salesperson...</option>
                {salespersons.map((u) => {
                  if (!u.position) return null;
                  return (
                    <option key={u._id} value={u.position._id}>
                      {u.position.code} - {u.firstName} {u.lastName}
                    </option>
                  );
                })}
              </select>
            )}
            <FieldError message={errors.salespersonPositionId?.message} />
          </div>

          {/* Password confirmation */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-celery-500">Confirm with your password</label>
            <Input
              {...register("password")}
              type="password"
              placeholder="Your password"
              autoComplete="current-password"
            />
            <FieldError message={errors.password?.message} />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateSalesperson.isPending || !isDirty}>
              {updateSalesperson.isPending ? "Saving..." : "Change salesperson"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmAssign.isOpen}
        onClose={confirmAssign.cancel}
        onConfirm={confirmAssign.confirm}
        title="Change salesperson?"
        description={`This will reassign the client and automatically update the advisor and region. This action cannot be undone easily.`}
        confirmLabel="Confirm change"
        isLoading={updateSalesperson.isPending}
      />
    </>
  );
};
