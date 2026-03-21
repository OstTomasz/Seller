import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";

const router = Router();

router.get("/", notificationController.getNotifications);
router.delete("/:id", notificationController.deleteNotification);
router.patch("/:id/read", notificationController.markAsRead);
router.post("/unarchive-request", notificationController.requestUnarchive);

export default router;
