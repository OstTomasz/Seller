type ActivityCallback = () => void;

const _callbacks = new Set<ActivityCallback>();
let _lastActivityAt = Date.now();

export const registerActivityCallback = (cb: ActivityCallback) => {
  _callbacks.add(cb);
};

export const unregisterActivityCallback = (cb: ActivityCallback) => {
  _callbacks.delete(cb);
};

export const notifyActivity = () => {
  _lastActivityAt = Date.now();
  _callbacks.forEach((cb) => cb());
};

/**
 * Returns timestamp of last activity — used by Footer to compute remaining time.
 */
export const getLastActivityAt = () => _lastActivityAt;
