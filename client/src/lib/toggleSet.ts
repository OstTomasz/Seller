export const toggleSetValue = <T>(prev: Set<T>, key: T): Set<T> => {
  const next = new Set(prev);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
};
