// src/features/layout/Topbar.tsx
import { Menu, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useScrolled } from "@/hooks/useScrolled";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import logo from "@/assets/topbar-logo.avif";

interface TopbarProps {
  onMenuOpen: () => void;
}

export const Topbar = ({ onMenuOpen }: TopbarProps) => {
  const { user, logout } = useAuthStore();
  const scrolled = useScrolled();

  return (
    <header
      className={cn(
        "topbar-header",
        "sticky top-0 z-40 px-4 lg:hidden",
        "flex items-center justify-between",
        "bg-bg-elevated border-b border-celery-700",
        scrolled ? "is-scrolled" : "",
      )}
    >
      {/* Left — hamburger + logo */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuOpen}
          aria-label="Open menu"
          className="p-2"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <img
            src={logo}
            alt="Seller CRM"
            className={cn(
              "topbar-logo w-auto object-contain",
              scrolled ? "is-scrolled" : "",
            )}
          />
          <span className="font-heading font-semibold text-celery-300 text-sm tracking-wide">
            Seller CRM
          </span>
        </div>
      </div>

      {/* Right — user info + logout */}
      <div className="flex items-center gap-3">
        {user ? (
          <div
            className={cn(
              "topbar-user-info flex flex-col items-end leading-tight",
              scrolled ? "is-scrolled" : "",
            )}
          >
            <span className="text-xs font-medium text-celery-300">
              {user.firstName}
            </span>
            <span className="text-xs text-celery-500 capitalize">
              {user.role}
            </span>
          </div>
        ) : null}

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          aria-label="Log out"
          className="p-2 text-celery-500 hover:text-error"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};