import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { LoginPage } from "@/features/auth/LoginPage";
import { ForcePasswordChange } from "@/features/auth/ForcePasswordChange";
import { NotFoundPage } from "@/features/shared/NotFoundPage";

// Protected route — redirects to /login if not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user } = useAuthStore();

  if (!token) return <Navigate to="/login" replace />;

  // force password change before accessing any other page
  if (user?.mustChangePassword)
    return <Navigate to="/change-password" replace />;

  return <>{children}</>;
};

// Auth route — redirects to / if already logged in
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuthStore();
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <AuthRoute>
              <LoginPage />
            </AuthRoute>
          }
        />

        {/* Force password change — needs token but blocks other pages */}
        <Route path="/change-password" element={<ForcePasswordChange />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div className="text-white">Dashboard — coming soon</div>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};
