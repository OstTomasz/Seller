import { useState } from "react";

interface UseConfirmReturn<T> {
  isOpen: boolean;
  payload: T | null;
  ask: (payload: T) => void;
  confirm: () => void;
  cancel: () => void;
}

/**
 * Manages confirm dialog state with a typed payload.
 * @param onConfirm - callback called with the stored payload on confirm
 */
export const useConfirm = <T = void>(onConfirm: (payload: T) => void): UseConfirmReturn<T> => {
  const [payload, setPayload] = useState<T | null>(null);

  const ask = (p: T) => setPayload(p);
  const cancel = () => setPayload(null);
  const confirm = () => {
    if (payload !== null) {
      onConfirm(payload);
      setPayload(null);
    }
  };

  return {
    isOpen: payload !== null,
    payload,
    ask,
    confirm,
    cancel,
  };
};
