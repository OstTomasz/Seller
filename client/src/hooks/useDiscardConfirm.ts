import { useState } from "react";

/**
 * Manages "discard changes" confirmation flow.
 * Call `tryClose()` instead of `onClose` — shows confirm if dirty.
 */
export const useDiscardConfirm = (isDirty: boolean, onClose: () => void) => {
  const [isOpen, setIsOpen] = useState(false);

  const tryClose = () => {
    if (isDirty) {
      setIsOpen(true);
    } else {
      onClose();
    }
  };

  const confirm = () => {
    setIsOpen(false);
    onClose();
  };

  const cancel = () => setIsOpen(false);

  return { isOpen, tryClose, confirm, cancel };
};
