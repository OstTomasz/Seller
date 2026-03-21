// client/src/router/AppRouter.tsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { LoginPage } from "@/features/auth/LoginPage";
import { ForcePasswordChange } from "@/features/auth/ForcePasswordChange";
import { NotFoundPage } from "@/features/shared/NotFoundPage";
import { PageTransition } from "./PageTransition";
import { AppLayout } from "@/components/layout/AppLayout";
import { ClientsPage } from "@/features/clients/ClientsPage";
import { ClientPage } from "@/features/clients/ClientPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import type { UserRole } from "@/types";
import { ArchivePage } from "@/features/archive/ArchivePage";

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuthStore();
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const PasswordChangeRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.mustChangePassword) return <Navigate to="/change-password" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const RoleRoute = ({ children, roles }: { children: React.ReactNode; roles: UserRole[] }) => {
  const { user } = useAuthStore();
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth — public */}
        <Route element={<PageTransition />}>
          <Route
            path="/login"
            element={
              <AuthRoute>
                <LoginPage />
              </AuthRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <PasswordChangeRoute>
                <ForcePasswordChange />
              </PasswordChangeRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* App — protected */}
        <Route
          element={
            <ProtectedLayout>
              <PageTransition />
            </ProtectedLayout>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientPage />} />
          <Route path="/company" element={<p className="text-celery-300">Company</p>} />
          <Route path="/settings" element={<p className="text-celery-300">Settings</p>} />
          <Route
            path="/management"
            element={
              <RoleRoute roles={["deputy", "director"]}>
                <p className="text-celery-300">Management</p>
              </RoleRoute>
            }
          />
          <Route
            path="/archive"
            element={
              <RoleRoute roles={["director"]}>
                <ArchivePage />
              </RoleRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
