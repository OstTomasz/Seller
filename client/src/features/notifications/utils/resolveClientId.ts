// client/src/features/notifications/utils/resolveClientId.ts

import { INotification } from "@/types";

/**
 * Extracts string clientId from a notification regardless of populate state.
 * Returns null for event-type notifications that have no client.
 */
export const resolveClientId = (clientId: INotification["clientId"]): string | null => {
  if (!clientId) return null;
  if (typeof clientId === "object" && "_id" in clientId) {
    return clientId._id;
  }
  if (typeof clientId === "string") {
    return clientId;
  }
  return null;
};

/** Returns true for notification types that are client-related */
export const isClientNotification = (type: INotification["type"]): boolean => {
  const CLIENT_TYPES: INotification["type"][] = [
    "archive_request",
    "archive_approved",
    "archive_rejected",
    "unarchive_request",
    "unarchive_approved",
    "unarchive_rejected",
    "client_unarchived",
  ];
  return CLIENT_TYPES.includes(type);
};
