import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const LogoutButton = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-400 hover:text-white transition-colors"
    >
      Log out
    </button>
  );
};
