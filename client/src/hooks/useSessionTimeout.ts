import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useIdleTimer } from "./useIdleTimer";
import { toast } from "sonner";
import {
  notifyActivity,
  registerActivityCallback,
  unregisterActivityCallback,
} from "@/lib/sessionActivity";
import { SESSION_CONFIG } from "@/config/session";

const { TIMEOUT_MS, WARNING_MS } = SESSION_CONFIG;

/**
 * Manages session timeout with warning modal.
 * Returns state needed to render the warning modal.
 */
export const useSessionTimeout = () => {
  const [showWarning, setShowWarning] = useState(false);
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleTimeout = useCallback(() => {
    setShowWarning(false);
    logout();
    navigate("/login");
    toast.info("You have been logged out due to inactivity.");
  }, [logout, navigate]);

  const handleWarning = useCallback(() => {
    setShowWarning(true);
  }, []);

  const { resetTimer } = useIdleTimer({
    timeoutMs: TIMEOUT_MS,
    warningMs: WARNING_MS,
    onWarning: handleWarning,
    onTimeout: handleTimeout,
  });
  useEffect(() => {
    registerActivityCallback(resetTimer);
    return () => unregisterActivityCallback(resetTimer);
  }, [resetTimer]);

  const extendSession = useCallback(() => {
    setShowWarning(false);
    notifyActivity();
  }, []);

  const logoutNow = useCallback(() => {
    setShowWarning(false);
    logout();
    navigate("/login");
  }, [logout, navigate]);

  return { showWarning, extendSession, logoutNow };
};
