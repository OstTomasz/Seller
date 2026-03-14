// src/router/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { LoginPage } from "@/features/auth/LoginPage";
import { ForcePasswordChange } from "@/features/auth/ForcePasswordChange";
import { NotFoundPage } from "@/features/shared/NotFoundPage";
import { PageTransition } from "./PageTransition";
import { AppLayout } from "@/components/layout/AppLayout";


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

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth pages — z animacją */}
        <Route element={<PageTransition />}>
          <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
          <Route path="/change-password" element={<PasswordChangeRoute><ForcePasswordChange /></PasswordChangeRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* App pages — AppLayout poza animacją, tylko content się animuje */}
        <Route element={<ProtectedLayout><PageTransition /></ProtectedLayout>}>
          <Route path="/" element={
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <p className="text-celery-300">Dashboard — coming soon</p>
            </div>
          } />
          <Route path="/clients" element={<p className="text-celery-300">Klienci</p>} />
          <Route path="/reminders" element={<p className="text-celery-300">Przypomnienia</p>} />
          <Route path="/settings" element={<p className="text-celery-300">Ustawienia</p>} />
          <Route path="/management" element={<p className="text-celery-300">Zarządzanie</p>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};