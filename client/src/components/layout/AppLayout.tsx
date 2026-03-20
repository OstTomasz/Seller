import { useState } from "react";
import { Topbar } from "./Topbar/Topbar";
import { Footer } from "./Footer/Footer";
import { Sidebar } from "./Sidebar/Sidebar";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { SessionWarningModal } from "./SessionWarningModal";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { showWarning, extendSession, logoutNow } = useSessionTimeout();

  return (
    <>
      <div className="min-h-screen bg-bg-base flex flex-col">
        <Topbar onMenuOpen={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
        <Footer variant="full" />
      </div>
      <SessionWarningModal isOpen={showWarning} onExtend={extendSession} onLogout={logoutNow} />
    </>
  );
};
