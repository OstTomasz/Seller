import { Menu, LogOut, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useScrolled } from "@/components/layout/Topbar/hooks/useScrolled";
import { Button } from "@/components/ui";
import { getNavLinks } from "@/components/shared/navLinks";
import { SidebarLink } from "../Sidebar/SidebarLink";
import { cn } from "@/lib/utils";
import { AppLogo } from "@/components/shared/AppLogo";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";

interface TopbarProps {
  onMenuOpen: () => void;
}

export const Topbar = ({ onMenuOpen }: TopbarProps) => {
  const { user, logout } = useAuthStore();
  const scrolled = useScrolled();
  const navigate = useNavigate();
  const { data: notifications = [] } = useNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const navLinks = user ? getNavLinks(user.role) : [];

  return (
    <header
      className={cn(
        "topbar-header",
        "sticky top-0 z-40 px-4",
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
          className="p-2 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <AppLogo scrolled={scrolled} />
      </div>

      {/* Center — desktop nav */}
      <nav className="hidden lg:flex items-center gap-1">
        {navLinks.map((link) => (
          <SidebarLink key={link.to} {...link} variant="nav" />
        ))}
      </nav>

      {/* Right — user info + logout */}
      <div className="flex items-center gap-3">
        {user ? (
          <div
            className={cn(
              "topbar-user-info flex flex-col items-end leading-tight",
              scrolled ? "is-scrolled" : "",
            )}
          >
            <span className="text-xs font-medium text-celery-300">{user.firstName}</span>
            <span className="text-xs text-celery-500 capitalize">{user.role}</span>
          </div>
        ) : null}

        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ pathname: "/", search: "?expand=notifications" })}
            aria-label="Notifications"
            className="p-2 text-celery-500 hover:text-celery-300"
          >
            <Bell className="h-4 w-4" />
          </Button>
          {unreadCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white pointer-events-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </div>

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
