import { Router } from "express";
import * as eventController from "../controllers/event.controller";

const router = Router();

router.get("/", eventController.getEvents);
router.get("/invitations", eventController.getPendingInvitations);
router.get("/users", eventController.getAllUsersForInvite);
router.get("/:id/invitations", eventController.getEventInvitations);
router.get("/:id", eventController.getEventById);
router.post("/", eventController.createEvent);
router.patch("/:id", eventController.updateEvent);
router.patch("/:id/respond", eventController.respondToInvitation);
router.delete("/:id", eventController.deleteEvent);

export default router;
