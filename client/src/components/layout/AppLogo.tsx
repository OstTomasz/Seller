import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";
import logo from "@/assets/topbar-logo.avif";

interface AppLogoProps {
  scrolled?: boolean;
  onClick?: () => void;
}

export const AppLogo = ({ scrolled = false, onClick }: AppLogoProps) => {
  return (
    <NavLink to="/" onClick={onClick} className="flex items-center gap-2">
      <img
        src={logo}
        alt="Seller CRM"
        className={cn("topbar-logo w-auto object-contain", scrolled ? "is-scrolled" : "")}
      />
      <span className="font-heading font-semibold text-celery-300 text-sm tracking-wide">
        Seller CRM
      </span>
    </NavLink>
  );
};