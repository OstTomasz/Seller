// server/src/services/notification.service.ts
import { INotification, NotificationType, UserRole } from "../types";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/errors";
import * as notificationRepository from "../repositories/notification.repository";
import * as userRepository from "../repositories/user.repository";
import * as positionRepository from "../repositories/position.repository";
import * as regionRepository from "../repositories/region.repository";
import * as clientRepository from "../repositories/client.repository";
import { getPositionIdsInSuperregion } from "../utils/rbac";

/**
 * Returns all notifications for the requesting user.
 */
export const getNotifications = async (userId: string): Promise<INotification[]> =>
  notificationRepository.findNotificationsByUserId(userId);

/**
 * Deletes a notification — only owner can delete.
 */
export const deleteNotification = async (notificationId: string, userId: string): Promise<void> => {
  const deleted = await notificationRepository.deleteNotificationById(notificationId, userId);
  if (!deleted) throw new NotFoundError("Notification not found");
};

/**
 * Marks notification as read — only owner.
 */
export const markAsRead = async (
  notificationId: string,
  userId: string,
): Promise<INotification> => {
  const notification = await notificationRepository.markNotificationAsRead(notificationId, userId);
  if (!notification) throw new NotFoundError("Notification not found");
  return notification;
};

/**
 * Sends archive request notification — directors only.
 */
export const notifyArchiveRequest = async (
  clientId: string,
  clientName: string,
  reason: string,
  assignedToPositionId: string,
  requesterRole: UserRole,
): Promise<void> => {
  const position = await positionRepository.findPositionById(assignedToPositionId);
  if (!position?.region) return;

  const regionId = position.region.toString();
  const recipients: string[] = [];

  if (requesterRole === "salesperson") {
    // notify advisor + deputy
    const advisorPosition = await positionRepository.findAdvisorPositionByRegionId(regionId);
    if (advisorPosition?.currentHolder) {
      recipients.push(advisorPosition.currentHolder.toString());
    }

    const region = await regionRepository.findRegionById(regionId);
    if (region?.parentRegion) {
      const superregion = await regionRepository.findRegionById(region.parentRegion.toString());
      if (superregion?.deputy) {
        const deputyPosition = await positionRepository.findPositionById(
          superregion.deputy.toString(),
        );
        if (deputyPosition?.currentHolder) {
          recipients.push(deputyPosition.currentHolder.toString());
        }
      }
    }
  } else if (requesterRole === "deputy") {
    // notify salesperson + advisor
    if (position.currentHolder) {
      recipients.push(position.currentHolder.toString());
    }

    const advisorPosition = await positionRepository.findAdvisorPositionByRegionId(regionId);
    if (advisorPosition?.currentHolder) {
      recipients.push(advisorPosition.currentHolder.toString());
    }
  }

  const directors = await userRepository.findUsersByRole("director");
  directors.forEach((d) => recipients.push(d._id.toString()));

  if (recipients.length === 0) return;

  await notificationRepository.createNotifications(
    [...new Set(recipients)].map((userId) => ({
      userId,
      type: "archive_request" as NotificationType,
      clientId,
      message: `Archive request for client ${clientName}: ${reason}`,
      metadata: { reason, companyName: clientName },
    })),
  );
};

/**
 * Deletes all archive_request notifications for a client.
 */
export const deleteArchiveRequestNotifications = async (clientId: string): Promise<void> => {
  await notificationRepository.deleteArchiveRequestByClientId(clientId);
};

/**
 * Sends notifications after client is archived — to salesperson, advisor, deputy.
 */
export const notifyClientArchived = async (
  clientId: string,
  clientName: string,
  assignedToPositionId: string,
  reason: string,
): Promise<void> => {
  const position = await positionRepository.findPositionById(assignedToPositionId);
  if (!position) return;

  const recipients: string[] = [];

  // salesperson
  if (position.currentHolder) {
    recipients.push(position.currentHolder.toString());
  }

  if (!position.region) {
    await notificationRepository.createNotifications(
      recipients.map((userId) => ({
        userId,
        type: "archive_approved" as NotificationType,
        clientId,
        message: `Client ${clientName} has been archived: ${reason}`,
        metadata: { reason, companyName: clientName },
      })),
    );
    return;
  }

  const regionId = position.region.toString();
  const region = await regionRepository.findRegionById(regionId);

  // advisor
  const advisorPositions = await positionRepository.findAdvisorPositionByRegionId(regionId);
  if (advisorPositions?.currentHolder) {
    recipients.push(advisorPositions.currentHolder.toString());
  }

  // deputy
  if (region?.parentRegion) {
    const superregion = await regionRepository.findRegionById(region.parentRegion.toString());
    if (superregion?.deputy) {
      const deputyPosition = await positionRepository.findPositionById(
        superregion.deputy.toString(),
      );
      if (deputyPosition?.currentHolder) {
        recipients.push(deputyPosition.currentHolder.toString());
      }
    }
  }

  await notificationRepository.createNotifications(
    [...new Set(recipients)].map((userId) => ({
      userId,
      type: "archive_approved" as NotificationType,
      clientId,
      message: `Client ${clientName} has been archived: ${reason}`,
      metadata: { reason, companyName: clientName },
    })),
  );
};

/**
 * Sends notifications after client is unarchived — to salesperson, advisor, deputy.
 */
export const notifyClientUnarchived = async (
  clientId: string,
  clientName: string,
  assignedToPositionId: string,
  reason: string,
): Promise<void> => {
  const position = await positionRepository.findPositionById(assignedToPositionId);
  if (!position) return;

  const recipients: string[] = [];

  if (position.currentHolder) recipients.push(position.currentHolder.toString());

  if (position.region) {
    const regionId = position.region.toString();
    const advisorPosition = await positionRepository.findAdvisorPositionByRegionId(regionId);
    if (advisorPosition?.currentHolder) {
      recipients.push(advisorPosition.currentHolder.toString());
    }

    const region = await regionRepository.findRegionById(regionId);
    if (region?.parentRegion) {
      const superregion = await regionRepository.findRegionById(region.parentRegion.toString());
      if (superregion?.deputy) {
        const deputyPosition = await positionRepository.findPositionById(
          superregion.deputy.toString(),
        );
        if (deputyPosition?.currentHolder) {
          recipients.push(deputyPosition.currentHolder.toString());
        }
      }
    }
  }

  await notificationRepository.createNotifications(
    [...new Set(recipients)].map((userId) => ({
      userId,
      type: "client_unarchived" as NotificationType,
      clientId,
      message: `Client ${clientName} has been unarchived`,
      metadata: { companyName: clientName, reason },
    })),
  );
};

/**
 * Sends unarchive request notification to all directors.
 */
export const notifyUnarchiveRequest = async (
  clientId: string,
  requesterId: string,
): Promise<void> => {
  const client = await clientRepository.findClientById(clientId);
  if (!client) throw new NotFoundError("Client not found");
  if (client.status !== "archived") throw new BadRequestError("Client is not archived");

  const directors = await userRepository.findUsersByRole("director");
  if (directors.length === 0) return;

  await notificationRepository.createNotifications(
    directors.map((d) => ({
      userId: d._id.toString(),
      type: "unarchive_request" as NotificationType,
      clientId,
      message: `Unarchive request for client ${client.companyName}`,
      metadata: { companyName: client.companyName },
    })),
  );
};
/**
 * Notifies salesperson that their archive request was rejected.
 */
export const notifyArchiveRejected = async (
  clientId: string,
  clientName: string,
  assignedToPositionId: string,
  reason: string,
): Promise<void> => {
  const position = await positionRepository.findPositionById(assignedToPositionId);
  if (!position) return;

  const recipients: string[] = [];

  if (position.currentHolder) {
    recipients.push(position.currentHolder.toString());
  }

  if (position.region) {
    const regionId = position.region.toString();

    const advisorPosition = await positionRepository.findAdvisorPositionByRegionId(regionId);
    if (advisorPosition?.currentHolder) {
      recipients.push(advisorPosition.currentHolder.toString());
    }

    const region = await regionRepository.findRegionById(regionId);
    if (region?.parentRegion) {
      const superregion = await regionRepository.findRegionById(region.parentRegion.toString());
      if (superregion?.deputy) {
        const deputyPosition = await positionRepository.findPositionById(
          superregion.deputy.toString(),
        );
        if (deputyPosition?.currentHolder) {
          recipients.push(deputyPosition.currentHolder.toString());
        }
      }
    }
  }

  if (recipients.length === 0) return;

  await notificationRepository.createNotifications(
    [...new Set(recipients)].map((userId) => ({
      userId,
      type: "archive_rejected" as NotificationType,
      clientId,
      message: `Archive request rejected for client ${clientName}: ${reason}`,
      metadata: { rejectionReason: reason, companyName: clientName },
    })),
  );
};

export const markAsUnread = async (
  notificationId: string,
  userId: string,
): Promise<INotification> => {
  const notification = await notificationRepository.markNotificationAsUnread(
    notificationId,
    userId,
  );
  if (!notification) throw new NotFoundError("Notification not found");
  return notification;
};

export const deleteUnarchiveRequestNotifications = async (clientId: string): Promise<void> => {
  await notificationRepository.deleteUnarchiveRequestByClientId(clientId);
};

export const notifyUnarchiveRejected = async (
  clientId: string,
  clientName: string,
  assignedToPositionId: string,
  reason: string,
): Promise<void> => {
  const position = await positionRepository.findPositionById(assignedToPositionId);
  if (!position) return;

  const recipients: string[] = [];

  if (position.currentHolder) {
    recipients.push(position.currentHolder.toString());
  }

  if (position.region) {
    const regionId = position.region.toString();

    const advisorPosition = await positionRepository.findAdvisorPositionByRegionId(regionId);
    if (advisorPosition?.currentHolder) {
      recipients.push(advisorPosition.currentHolder.toString());
    }

    const region = await regionRepository.findRegionById(regionId);
    if (region?.parentRegion) {
      const superregion = await regionRepository.findRegionById(region.parentRegion.toString());
      if (superregion?.deputy) {
        const deputyPosition = await positionRepository.findPositionById(
          superregion.deputy.toString(),
        );
        if (deputyPosition?.currentHolder) {
          recipients.push(deputyPosition.currentHolder.toString());
        }
      }
    }
  }

  if (recipients.length === 0) return;

  await notificationRepository.createNotifications(
    [...new Set(recipients)].map((userId) => ({
      userId,
      type: "unarchive_rejected" as NotificationType,
      clientId,
      message: `Unarchive request rejected for client ${clientName}: ${reason}`,
      metadata: { companyName: clientName, rejectionReason: reason },
    })),
  );
};
