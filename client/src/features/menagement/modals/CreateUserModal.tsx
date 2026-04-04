// client/src/features/menagement/modals/CreateUserModal.tsx
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, Button, Input, Select } from "@/components/ui";

import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui";
import { toast } from "sonner";
import type { PositionWithHolder } from "@/types";
import { useAllPositions, useCreateUser } from "../hooks/useManagementStructure";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email").endsWith("@seller.com", "Must be @seller.com"),
  temporaryPassword: z.string().min(8, "Min 8 characters"),
  phone: z
    .string()
    .min(1, "Required")
    .regex(/^\+?[\d\s\-()]{7,15}$/, "Invalid phone number"),
  grade: z.string().nullable(),
  positionId: z.string().min(1, "Position is required"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  availablePositions: { id: string; code: string; type?: string }[];
}

export const CreateUserModal = ({ isOpen, onClose, availablePositions }: Props) => {
  const { mutate, isPending } = useCreateUser();
  const { data: allPositions } = useAllPositions();
  const {
    isOpen: isCancelOpen,
    ask: askCancel,
    confirm: confirmCancel,
    cancel: cancelCancel,
  } = useConfirm<string>(() => {
    reset();
    onClose();
  });

  const submitConfirm = useConfirm<FormData>((data) => {
    mutate(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        temporaryPassword: data.temporaryPassword,
        phone: data.phone,
        role: "salesperson",
        grade: gradeRequired && data.grade ? (Number(data.grade) as 1 | 2 | 3 | 4) : null,
        positionId: data.positionId,
      },
      {
        onSuccess: () => {
          toast.success("User created");
          reset();
          onClose();
        },
        onError: (e: unknown) => {
          const msg = (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message;
          toast.error(msg ?? "Failed to create user");
        },
      },
    );
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { grade: null, positionId: "" },
  });

  const selectedPositionId = useWatch({ control, name: "positionId" });

  // Determine position type to conditionally show grade
  const selectedPosition = allPositions?.find(
    (p: PositionWithHolder) => p._id === selectedPositionId,
  );
  const isDeputyPosition = selectedPosition?.type === "deputy";
  const gradeRequired = !!selectedPositionId && !isDeputyPosition;

  const onSubmit = (data: FormData) => {
    submitConfirm.ask(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create user" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="First name" error={errors.firstName?.message} {...register("firstName")} />
          <Input label="Last name" error={errors.lastName?.message} {...register("lastName")} />
        </div>
        <Input label="Email" error={errors.email?.message} {...register("email")} />
        <Input label="Phone" error={errors.phone?.message} {...register("phone")} />
        <Input
          label="Temporary password"
          type="text"
          error={errors.temporaryPassword?.message}
          {...register("temporaryPassword")}
        />
        <Select
          label="Position"
          error={errors.positionId?.message}
          options={availablePositions.map((p) => ({ value: p.id, label: p.code }))}
          placeholder="Select position…"
          {...register("positionId")}
        />
        {gradeRequired ? (
          <Select
            label="Grade"
            error={errors.grade?.message}
            options={[1, 2, 3, 4].map((g) => ({ value: String(g), label: String(g) }))}
            placeholder="Select grade…"
            {...register("grade")}
          />
        ) : null}
        <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
          <Button variant="ghost" type="button" onClick={() => askCancel("")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create user"}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={isCancelOpen}
        title="Discard changes?"
        description="User will not be created. Are you sure?"
        onConfirm={confirmCancel}
        onClose={cancelCancel}
      />
      <ConfirmDialog
        isOpen={submitConfirm.isOpen}
        onClose={submitConfirm.cancel}
        onConfirm={submitConfirm.confirm}
        title="Create user?"
        description="Are you sure you want to create this user?"
        confirmLabel="Create"
        isLoading={isPending}
      />
    </Modal>
  );
};
