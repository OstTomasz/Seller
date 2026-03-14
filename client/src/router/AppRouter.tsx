import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { LoginPage } from "@/features/auth/LoginPage";
import { ForcePasswordChange } from "@/features/auth/ForcePasswordChange";
import { NotFoundPage } from "@/features/shared/NotFoundPage";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { Topbar } from "@/features/layout/Topbar";

// Redirects to /login if not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user } = useAuthStore();

  if (!token) return <Navigate to="/login" replace />;
  if (user?.mustChangePassword) return <Navigate to="/change-password" replace />;

  return <>{children}</>;
};

// Redirects to / if already logged in
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuthStore();
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Requires token but blocks access to other pages until password is changed
const PasswordChangeRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={
            <AuthRoute>
              <LoginPage />
            </AuthRoute>
          }
        />

        {/* Requires token, shown before accessing app */}
        <Route
          path="/change-password"
          element={
            <PasswordChangeRoute>
              <ForcePasswordChange />
            </PasswordChangeRoute>
          }
        />

        {/* Protected — will wrap with layout later */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
<Topbar onMenuOpen={() => { }} />

              <div className="min-h-500 bg-bg-base flex flex-col items-center justify-center gap-4">
                <p className="text-celery-300">Dashboard — coming soon</p>
                <LogoutButton />
              </div>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};