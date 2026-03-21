// server/src/repositories/notification.repository.ts
import Notification from "../models/Notification";
import { NotificationType, INotification } from "../types";

/**
 * Creates a notification for a single user.
 */
export const createNotification = async (data: {
  userId: string;
  type: NotificationType;
  clientId: string;
  message: string;
  metadata?: { reason?: string; rejectionReason?: string; companyName?: string };
}): Promise<INotification> => {
  const notification = new Notification(data);
  return notification.save() as Promise<INotification>;
};

/**
 * Creates notifications for multiple users at once.
 */
export const createNotifications = async (
  data: {
    userId: string;
    type: NotificationType;
    clientId: string;
    message: string;
    metadata?: { reason?: string; rejectionReason?: string; companyName?: string };
  }[],
): Promise<void> => {
  await Notification.insertMany(data);
};

/**
 * Returns all notifications for a user, newest first.
 */
export const findNotificationsByUserId = async (userId: string): Promise<INotification[]> =>
  Notification.find({ userId })
    .populate("clientId", "companyName numericId")
    .sort({ createdAt: -1 });

/**
 * Deletes a single notification by id and userId (prevents deleting others' notifications).
 */
export const deleteNotificationById = async (
  notificationId: string,
  userId: string,
): Promise<boolean> => {
  const result = await Notification.deleteOne({ _id: notificationId, userId });
  return result.deletedCount > 0;
};

/**
 * Marks a notification as read.
 */
export const markNotificationAsRead = async (
  notificationId: string,
  userId: string,
): Promise<INotification | null> =>
  Notification.findOneAndUpdate({ _id: notificationId, userId }, { read: true }, { new: true });

export const markNotificationAsUnread = async (
  notificationId: string,
  userId: string,
): Promise<INotification | null> =>
  Notification.findOneAndUpdate({ _id: notificationId, userId }, { read: false }, { new: true });

/**
 * Deletes archive_request notification for a given clientId.
 */
export const deleteArchiveRequestByClientId = async (clientId: string): Promise<void> => {
  await Notification.deleteMany({ clientId, type: "archive_request" });
};

export const deleteUnarchiveRequestByClientId = async (clientId: string): Promise<void> => {
  await Notification.deleteMany({ clientId, type: "unarchive_request" });
};
