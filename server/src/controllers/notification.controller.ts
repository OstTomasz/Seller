import { Request, Response, NextFunction } from "express";
import * as notificationService from "../services/notification.service";
import { wrapAsync } from "../utils/wrapAsync";
import { BadRequestError } from "../utils/errors";

export const getNotifications = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const notifications = await notificationService.getNotifications(req.userId!);
    res.status(200).json({ notifications });
  },
);

export const deleteNotification = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    await notificationService.deleteNotification(id, req.userId!);
    res.status(200).json({ message: "Notification deleted" });
  },
);

export const markAsRead = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const notification = await notificationService.markAsRead(id, req.userId!);
    res.status(200).json({ notification });
  },
);

export const requestUnarchive = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { clientId } = req.body;
    if (!clientId) throw new BadRequestError("clientId is required");

    await notificationService.notifyUnarchiveRequest(clientId, req.userId!);
    res.status(200).json({ message: "Unarchive request sent" });
  },
);
export const markAsUnread = wrapAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const notification = await notificationService.markAsUnread(id, req.userId!);
  res.status(200).json({ notification });
});
