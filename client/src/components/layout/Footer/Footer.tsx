import { ArrowUp, MessageSquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { SupportModal } from "./SupportModal";
import { SocialLinks } from "../../shared/SocialLinks";
import { getLastActivityAt } from "@/lib/sessionActivity";

import { SESSION_CONFIG } from "@/config/session";

interface FooterProps {
  variant?: "full" | "minimal";
}

const useRemainingTime = () => {
  const [remaining, setRemaining] = useState(SESSION_CONFIG.TIMEOUT_MS);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - getLastActivityAt();
      setRemaining(Math.max(0, SESSION_CONFIG.TIMEOUT_MS - elapsed));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

export const Footer = ({ variant = "full" }: FooterProps) => {
  const year = new Date().getFullYear();
  const [supportOpen, setSupportOpen] = useState(false);
  const timeDisplay = useRemainingTime();

  return (
    <>
      <footer className="border-t border-celery-700 bg-bg-elevated px-4 py-4 sm:px-6">
        {variant === "full" ? (
          // ── Full layout ──────────────────────────────────────
          <div className="flex flex-col items-center gap-3 sm:grid sm:grid-cols-3 sm:items-center">
            {/* Left — socials */}
            <SocialLinks />

            {/* Center — copyright */}
            <div className="flex justify-center order-last sm:order-0">
              <span className="text-xs text-celery-500">© {year} Seller CRM</span>
            </div>

            {/* Right — SessionTImeout + report + back to top */}
            <div className="flex items-center justify-center gap-4 sm:justify-end">
              <span className="text-xs text-celery-600 font-mono">Session: {timeDisplay}</span>
              <button
                onClick={() => setSupportOpen(true)}
                className="flex items-center gap-1.5 text-xs text-celery-500 hover:text-celery-400"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                <span>Support</span>
              </button>
              <button
                onClick={scrollToTop}
                aria-label="Back to top"
                className="flex items-center gap-1.5 text-xs text-celery-500 hover:text-celery-400"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          // ── Minimal layout (login page) ──────────────────────
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            {/* Socials */}
            <SocialLinks />

            {/* Copyright */}
            <span className="text-xs text-celery-500">© {year} Seller CRM</span>
          </div>
        )}
      </footer>

      {variant === "full" ? (
        <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
      ) : null}
    </>
  );
};
