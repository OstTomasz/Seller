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

const loginSchema = z.object({
  email: z.email("Invalid email address").endsWith("@seller.com", "Email domain must be @seller.com"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginHeader = () => (
  <div className="flex flex-col items-center mb-8 gap-3">
    <img
      src="/src/assets/logo.png"
      alt="Seller CRM logo"
      className="object-contain"
      style={{ width: "clamp(120px, 70%, 280px)" }}
    />
    <h1
      className="font-bold text-celery-100 tracking-wide"
      style={{ fontSize: "clamp(1.7rem, 4vw, 2.25rem)" }}
    >
      Seller CRM
    </h1>
    <p className="text-sm text-celery-500">Sign in to your account</p>
  </div>
);

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "all",
  });

  const { mutate: login, isPending } = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ data }) => {
      setAuth(data.token, data.user);
      if (data.user.mustChangePassword) {
        navigate("/change-password");
      } else {
        navigate("/");
      }
    },
    onError: (error) => {
      const message = isAxiosError(error)
        ? (error.response?.data as ApiError)?.message
        : "Something went wrong";
      toast.error(message ?? "Something went wrong");
    },
  });

  const onSubmit = (data: LoginFormData) => login(data);

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div
        className="w-full"
        style={{ maxWidth: "clamp(320px, 90vw, 480px)" }}
      >
        <LoginHeader />
        <Card
          elevated
          className="shadow-2xl"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />
            <Button
              type="submit"
              isLoading={isPending}
              size="lg"
              className="w-full mt-2"
            >
              Sign in
            </Button>
          </form>
          <p className="text-center text-xs text-celery-500 mt-6">
            Forgot your password? Contact your administrator.
          </p>
        </Card>
      </div>
    </div>
  );
};