import type { INotification } from "@/types";

export const notificationTypeLabels: Record<INotification["type"], string> = {
  archive_request: "Archive request",
  archive_approved: "Client archived",
  archive_rejected: "Archive rejected",
  unarchive_request: "Unarchive request",
  unarchive_approved: "Client unarchived",
  unarchive_rejected: "Unarchive rejected",
  client_unarchived: "Client unarchived",
  event_invitation: "Event invitation",
  event_mandatory: "Mendatory event",
  event_conflict: "Event conflict",
  event_response: "Event response",
  event_updated: "Event updated",
  event_cancelled: "Event cancelled",
  company_file_added: "Company file added",
  company_note_added: "Company note added",
};

export const notificationTypeBadges: Record<
  INotification["type"],
  "warning" | "muted" | "gold" | "active" | "error"
> = {
  archive_request: "warning",
  archive_approved: "muted",
  archive_rejected: "error",
  unarchive_request: "gold",
  unarchive_approved: "active",
  unarchive_rejected: "error",
  client_unarchived: "active",
  event_invitation: "gold",
  event_mandatory: "warning",
  event_conflict: "error",
  event_response: "active",
  event_updated: "active",
  event_cancelled: "error",
  company_file_added: "gold",
  company_note_added: "muted",
};
