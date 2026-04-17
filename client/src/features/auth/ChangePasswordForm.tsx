import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { authApi } from "@/api/auth";
import { ApiError } from "@/types";
import { Button, Input } from "@/components/ui";
import { useAuthStore } from "@/store/authStore";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof changePasswordSchema>;

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

export const ChangePasswordForm = ({ onSuccess }: ChangePasswordFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onBlur",
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const { updateAuth } = useAuthStore();

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: (response) => {
      updateAuth(response.data.token, { mustChangePassword: false });
      toast.success("Password changed successfully");
      reset();
      onSuccess?.();
    },
    onError: (error) => {
      const message = isAxiosError(error)
        ? (error.response?.data as ApiError)?.message
        : "Something went wrong";
      toast.error(message ?? "Something went wrong");
    },
  });

  return (
    <form
      onSubmit={handleSubmit((d) =>
        mutate({ currentPassword: d.currentPassword, newPassword: d.newPassword }),
      )}
      className="flex flex-col gap-4 w-[90%] mx-auto"
    >
      <Input
        label="Current password"
        type="password"
        placeholder="••••••••"
        error={errors.currentPassword?.message}
        {...register("currentPassword")}
      />
      <Input
        label="New password"
        type="password"
        placeholder="••••••••"
        error={errors.newPassword?.message}
        {...register("newPassword")}
      />
      <Input
        label="Confirm new password"
        type="password"
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled isLoading={isPending} className="flex flex-col">
          <p>Change password</p>
          {/* demo version */}
          <p className="text-red-600">Disabled due demo version</p>
        </Button>
      </div>
    </form>
  );
};
