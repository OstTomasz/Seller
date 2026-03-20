import { useEffect, useRef, useCallback } from "react";

interface UseIdleTimerOptions {
  timeoutMs: number;
  warningMs: number;
  onWarning: () => void;
  onTimeout: () => void;
}

/**
 * Tracks user inactivity and fires callbacks before and on session timeout.
 * Resets on any user interaction.
 */
export const useIdleTimer = ({
  timeoutMs,
  warningMs,
  onWarning,
  onTimeout,
}: UseIdleTimerOptions) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    clearTimers();

    warningRef.current = setTimeout(() => {
      onWarning();
    }, timeoutMs - warningMs);

    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, timeoutMs);
  }, [timeoutMs, warningMs, onWarning, onTimeout, clearTimers]);

  useEffect(() => {
    resetTimer();
    return () => clearTimers();
  }, [resetTimer, clearTimers]);

  return { resetTimer };
};
