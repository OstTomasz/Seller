import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, Button, Input, Select } from "@/components/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/api/users";
import { toast } from "sonner";
import type { User } from "@/types";

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email").endsWith("@seller.com", "Must be @seller.com"),
  phone: z.string().nullable(),
  grade: z.string().nullable(),
});

type FormData = z.infer<typeof schema>;

// ── Hook ──────────────────────────────────────────────────────────────────────

const useUpdateUser = (userId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof usersApi.updateUser>[1]) =>
      usersApi.updateUser(userId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-users"] });
      qc.invalidateQueries({ queryKey: ["management-users"] });
      qc.invalidateQueries({ queryKey: ["user-details", userId] });
      qc.invalidateQueries({ queryKey: ["company-structure"] });
    },
  });
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  user: User | null;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const EditUserModal = ({ user, onClose }: Props) => {
  const { mutate, isPending } = useUpdateUser(user?._id ?? "");

  const showGrade = user?.role === "advisor" || user?.role === "salesperson";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: null,
      grade: null,
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone ?? null,
        grade: user.grade ? String(user.grade) : null,
      });
    }
  }, [user, reset]);

  const onSubmit = (data: FormData) => {
    mutate(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        grade: showGrade && data.grade ? (Number(data.grade) as 1 | 2 | 3 | 4) : undefined,
      },
      {
        onSuccess: () => {
          toast.success("User updated");
          onClose();
        },
        onError: (e: unknown) => {
          const msg = (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message;
          toast.error(msg ?? "Failed to update user");
        },
      },
    );
  };

  return (
    <Modal isOpen={!!user} onClose={onClose} title="Edit user" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Basic info */}
        <div className="grid grid-cols-2 gap-4">
          <Input label="First name" error={errors.firstName?.message} {...register("firstName")} />
          <Input label="Last name" error={errors.lastName?.message} {...register("lastName")} />
        </div>
        <Input label="Email" error={errors.email?.message} {...register("email")} />
        <Input label="Phone" error={errors.phone?.message} {...register("phone")} />
        {showGrade ? (
          <Select
            label="Grade"
            error={errors.grade?.message}
            options={[1, 2, 3, 4].map((g) => ({ value: String(g), label: String(g) }))}
            placeholder="Select grade…"
            {...register("grade")}
          />
        ) : null}

        <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!isDirty || isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
