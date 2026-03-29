import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, Button, Input, Select } from "@/components/ui";
import { useCreateUser } from "../hooks/useManagementStructure";
import { toast } from "sonner";
import type { UserRole } from "@/types";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.email("Invalid email").endsWith("@seller.com", "Must be @seller.com"),
  temporaryPassword: z.string().min(8, "Min 8 characters"),
  role: z.enum(["advisor", "salesperson"]),
  grade: z.string().nullable(),
  positionId: z.string().nullable(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  availablePositions: { id: string; code: string }[];
  allowedRoles: UserRole[];
}

export const CreateUserModal = ({ isOpen, onClose, availablePositions, allowedRoles }: Props) => {
  const { mutate, isPending } = useCreateUser();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { grade: null, positionId: null },
  });

  const onSubmit = (data: FormData) => {
    mutate(
      {
        ...data,
        grade: data.grade ? (Number(data.grade) as 1 | 2 | 3 | 4) : null,
        positionId: data.positionId || null,
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
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create user" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="First name" error={errors.firstName?.message} {...register("firstName")} />
          <Input label="Last name" error={errors.lastName?.message} {...register("lastName")} />
        </div>
        <Input label="Email" error={errors.email?.message} {...register("email")} />
        <Input
          label="Temporary password"
          type="password"
          error={errors.temporaryPassword?.message}
          {...register("temporaryPassword")}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Role"
            error={errors.role?.message}
            options={allowedRoles
              .filter((r) => r === "advisor" || r === "salesperson")
              .map((r) => ({ value: r, label: r }))}
            placeholder="Select role…"
            {...register("role")}
          />
          <Select
            label="Grade"
            error={errors.grade?.message}
            options={[1, 2, 3, 4].map((g) => ({ value: String(g), label: String(g) }))}
            placeholder="Select grade…"
            {...register("grade")}
          />
        </div>
        <Select
          label="Position (optional)"
          options={availablePositions.map((p) => ({ value: p.id, label: p.code }))}
          placeholder="Assign to position…"
          {...register("positionId")}
        />
        <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create user"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
