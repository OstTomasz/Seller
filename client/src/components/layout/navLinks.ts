// src/components/layout/navLinks.ts
import {
  LayoutDashboard,
  Users,
  Bell,
  Settings,
  UserCog,
  FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@/types";

export interface NavLink {
  to: string;
  icon: LucideIcon;
  label: string;
}

export const mainLinks: NavLink[] = [
  { to: "/",          icon: LayoutDashboard, label: "Dashboard" },
  { to: "/clients",   icon: Users,           label: "Klienci" },
  { to: "/reminders", icon: Bell,            label: "Przypomnienia" },
  { to: "/settings",  icon: Settings,        label: "Ustawienia" },
];

export const managementLinks: NavLink[] = [
  { to: "/management",           icon: UserCog,  label: "Zarządzanie" },
  { to: "/management/documents", icon: FileText, label: "Dokumenty firmowe" },
];

export const MANAGEMENT_ROLES: UserRole[] = ["director", "deputy"];

export const getNavLinks = (role: UserRole): NavLink[] => {
  const canManage = MANAGEMENT_ROLES.includes(role);
  return canManage ? [...mainLinks, ...managementLinks] : mainLinks;
};