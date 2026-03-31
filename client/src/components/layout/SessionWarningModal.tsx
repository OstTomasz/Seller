import { useEffect, useState } from "react";
import { Modal, Button } from "@/components/ui";
import { Clock } from "lucide-react";
import { SESSION_CONFIG } from "@/config/session";

interface SessionWarningModalProps {
  isOpen: boolean;
  onExtend: () => void;
  onLogout: () => void;
}

export const SessionWarningModal = ({ isOpen, onExtend, onLogout }: SessionWarningModalProps) => {
  const [secondsLeft, setSecondsLeft] = useState(SESSION_CONFIG.WARNING_SECONDS);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(SESSION_CONFIG.WARNING_SECONDS);
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <Modal isOpen={isOpen} onClose={onExtend} title="Session expiring" size="sm">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 py-2">
          <Clock className="h-8 w-8 text-celery-500" />
          <p className="text-sm text-celery-300 text-center">
            Your session will expire due to inactivity.
          </p>
          <span className="text-2xl font-mono font-bold text-celery-100">{timeDisplay}</span>
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
          <Button variant="ghost" onClick={onLogout}>
            Log out
          </Button>
          <Button onClick={onExtend}>Stay logged in</Button>
        </div>
      </div>
    </Modal>
  );
};
