// src/components/layout/Sidebar.tsx
import { X, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui";
import { SidebarLink } from "./SidebarLink";
import { mainLinks, managementLinks, MANAGEMENT_ROLES } from "./navLinks";
import { AppLogo } from "./AppLogo";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, logout } = useAuthStore();

  const canManage = user ? MANAGEMENT_ROLES.includes(user.role) : false;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          {/* overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={onClose}
          />

          {/* drawer */}
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden overflow-hidden w-72">
            <motion.aside
              key="drawer"
              initial={{ translateX: "-100%" }}
              animate={{ translateX: "0%" }}
              exit={{ translateX: "-100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-bg-elevated border-r border-celery-700"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-celery-700">
<AppLogo onClick={onClose}/>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  aria-label="Close menu"
                  className="p-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* User info */}
              {user ? (
                <div className="px-4 py-3 border-b border-celery-700">
                  <p className="text-sm font-medium text-celery-200">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-celery-500 capitalize mt-0.5">{user.role}</p>
                </div>
              ) : null}

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
                {mainLinks.map((link) => (
                  <SidebarLink key={link.to} {...link} onClick={onClose} />
                ))}

                {canManage ? (
                  <div className="mt-4">
                    <p className="px-3 mb-2 text-xs font-semibold text-celery-600 uppercase tracking-wider">
                      Zarządzanie
                    </p>
                    {managementLinks.map((link) => (
                      <SidebarLink key={link.to} {...link} onClick={onClose} />
                    ))}
                  </div>
                ) : null}
              </nav>

              {/* Logout */}
              <div className="px-3 py-4 border-t border-celery-700">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-celery-500 hover:bg-celery-800 hover:text-error"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Wyloguj</span>
                </button>
              </div>
            </motion.aside>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
};