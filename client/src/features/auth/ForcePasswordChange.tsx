import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const ForcePasswordChange = () => {
  const navigate = useNavigate();
  const { user, updateAuth } = useAuthStore();

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-8">
      <div className="landscape-grid">
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
            <ChangePasswordForm
              onSuccess={() => {
                updateAuth(null, { mustChangePassword: false });
                navigate("/");
              }}
            />
          </Card>
        </div>
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
