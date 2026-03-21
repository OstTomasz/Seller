// client/src/components/shared/navLinks.ts

import { LayoutDashboard, Users, Building2, Settings, UserCog, Archive } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@/types";

export interface NavLink {
  to: string;
  icon: LucideIcon;
  label: string;
}

const dashboardLink: NavLink = { to: "/", icon: LayoutDashboard, label: "Dashboard" };
const clientsLink: NavLink = { to: "/clients", icon: Users, label: "Clients" };
const companyLink: NavLink = { to: "/company", icon: Building2, label: "Company" };
const manageLink: NavLink = { to: "/management", icon: UserCog, label: "Manage" };
const archiveLink: NavLink = { to: "/archive", icon: Archive, label: "Archive" };
const settingsLink: NavLink = { to: "/settings", icon: Settings, label: "Settings" };

export const getNavLinks = (role: UserRole): NavLink[] => {
  if (role === "salesperson" || role === "advisor") {
    return [dashboardLink, clientsLink, companyLink, settingsLink];
  }

  if (role === "deputy") {
    return [dashboardLink, clientsLink, companyLink, manageLink, settingsLink];
  }

  if (role === "director") {
    return [dashboardLink, clientsLink, companyLink, archiveLink, manageLink, settingsLink];
  }

  return [dashboardLink];
};
