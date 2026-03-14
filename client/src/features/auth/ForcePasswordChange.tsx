import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api/auth";
import { ApiError } from "@/types";
import { Button, Card, Input } from "@/components/ui";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;



export const ForcePasswordChange = () => {
  const navigate = useNavigate();
const { user, updateAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    mode: "all",
  });

  const { mutate: changePassword, isPending } = useMutation({
    mutationFn: authApi.changePassword,
 onSuccess: ({ data }) => {
  updateAuth(data.token, { mustChangePassword: false }); // ← kluczowe
  toast.success("Password changed successfully");
  navigate("/");
},
    onError: (error) => {
      const message = isAxiosError(error)
        ? (error.response?.data as ApiError)?.message
        : "Something went wrong";
      toast.error(message ?? "Something went wrong");
    },
  });

  const onSubmit = (data: ChangePasswordFormData) =>
    changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });

return (
<div className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-8">
  <div className="landscape-grid">

    {/* Left — form */}
    <div>
      <div className="flex flex-col items-center mb-8 gap-3 text-center">
        <h1 className="font-bold text-celery-300 tracking-wide text-fluid-hero">
          Change your password
        </h1>
        <p className="text-fluid-sm text-celery-500">
          Logged in as <span className="text-celery-300">{user?.email}</span>
        </p>
      </div>
      <Card elevated>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
          <Button type="submit" isLoading={isPending} size="lg" className="w-full mt-2">
            Set new password
          </Button>
        </form>
      </Card>
    </div>

    {/* Right — image */}
    <div className="landscape-image">
      <img
        src="/src/assets/helpfull.avif"
        alt="Change password"
        className="object-contain w-full max-w-xs"
      />
    </div>

  </div>
</div>
);
};