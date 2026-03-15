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
import { Footer } from "@/components/layout/Footer/Footer";

const loginSchema = z.object({
  email: z.email("Invalid email address").endsWith("@seller.com", "Email domain must be @seller.com"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginHeader = () => (
  <div className="flex flex-col items-center mb-8 gap-3">
    <img
      src="/src/assets/logo.avif"
      alt="Seller CRM logo"
      className="object-contain w-fluid-logo"
    />
    <h1 className="font-bold text-celery-300 tracking-wide text-fluid-hero">
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
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* center content takes all available space */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-4">
        <div className="max-w-fluid-form w-full">
          <LoginHeader />
          <Card elevated className="shadow-2xl">
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
              <Button type="submit" isLoading={isPending} size="lg" className="w-full mt-2">
                Sign in
              </Button>
            </form>
            <p className="text-center text-xs text-celery-500 mt-6">
              Forgot your password? Contact your supervisor.
            </p>

          </Card>
        </div>
      </div>
      <Footer variant="minimal" />
    </div>
  );
};