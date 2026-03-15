import { Menu, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useScrolled } from "@/components/layout/Topbar/hooks/useScrolled";
import { Button } from "@/components/ui";
import { SidebarLink } from "../Sidebar/SidebarLink";
import { getNavLinks } from "../../shared/navLinks";
import { cn } from "@/lib/utils";
import { AppLogo } from "../../shared/AppLogo";


interface TopbarProps {
  onMenuOpen: () => void;
}

export const Topbar = ({ onMenuOpen }: TopbarProps) => {
  const { user, logout } = useAuthStore();
  const scrolled = useScrolled();

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
          <div className={cn(
            "topbar-user-info flex flex-col items-end leading-tight",
            scrolled ? "is-scrolled" : "",
          )}>
            <span className="text-xs font-medium text-celery-300">{user.firstName}</span>
            <span className="text-xs text-celery-500 capitalize">{user.role}</span>
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