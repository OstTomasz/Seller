// src/features/auth/LoginPage.tsx
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
  email: z
    .email("Invalid email address")
    .endsWith("@seller.com", "Email domain must be @seller.com"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

type TestUser = { email: string; password: string; note: string };
type TestLabel = { label: string };

const TEST_USERS: (TestUser | TestLabel)[] = [
  { email: "director@seller.com", password: "password123", note: "" },
  { label: "--- Poland North ---" },
  { email: "deputy1@seller.com", password: "password123", note: "" },
  { email: "adv.pom@seller.com", password: "password123", note: "POM advisor" },
  { email: "sp1.pom@seller.com", password: "password123", note: "3 active + 1 archived" },
  { email: "sp2.pom@seller.com", password: "password123", note: "3 active + 1 archived" },
  { email: "adv.war@seller.com", password: "password123", note: "WAR advisor" },
  { email: "sp1.war@seller.com", password: "password123", note: "3 active + 1 archived" },
  { email: "sp2.war@seller.com", password: "password123", note: "3 active + 1 archived" },
  { label: "--- Poland South ---" },
  { email: "deputy2@seller.com", password: "password123", note: "" },
  { email: "adv.mal@seller.com", password: "password123", note: "MAL advisor" },
  { email: "sp1.mal@seller.com", password: "password123", note: "3 active + 1 archived" },
  { email: "sp2.mal@seller.com", password: "password123", note: "3 active + 1 archived" },
  { email: "adv.sla@seller.com", password: "password123", note: "SLA advisor" },
  { email: "sp1.sla@seller.com", password: "password123", note: "3 active + 1 archived" },
  { email: "sp2.sla@seller.com", password: "password123", note: "3 active + 1 archived" },
];

const LoginHeader = () => (
  <div className="flex flex-col items-center mb-8 gap-3">
    <img
      src="/src/assets/logo.avif"
      alt="Seller CRM logo"
      className="object-contain w-fluid-logo"
    />
    <h1 className="font-bold text-celery-300 tracking-wide text-fluid-hero">Seller CRM</h1>
    <p className="text-sm text-celery-500">Sign in to your account</p>
  </div>
);

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    setValue,
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

  const fillCredentials = (email: string, password: string) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", password, { shouldValidate: true });
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
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

            {/* Test users */}
            <div className="mt-4 border-t border-celery-800 pt-4 font-mono text-sm flex flex-col gap-0.5">
              {TEST_USERS.map((row, i) =>
                "label" in row ? (
                  <span key={i} className="text-celery-600 mt-2">
                    {row.label}
                  </span>
                ) : (
                  <button
                    key={i}
                    type="button"
                    onClick={() => fillCredentials(row.email, row.password)}
                    className="flex items-center gap-2 hover:bg-celery-800 rounded px-1 -mx-1 text-left"
                  >
                    <span className="text-celery-300">{row.email}</span>
                    <span className="text-celery-700">/</span>
                    <span className="text-celery-500">{row.password}</span>
                    {row.note ? <span className="text-celery-700 text-xs">{row.note}</span> : null}
                  </button>
                ),
              )}
            </div>
          </Card>
        </div>
      </div>
      <Footer variant="minimal" />
    </div>
  );
};
