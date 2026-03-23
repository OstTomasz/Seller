import { Router } from "express";
import * as eventController from "../controllers/event.controller";

const router = Router();

router.get("/", eventController.getEvents);
router.get("/invitations", eventController.getPendingInvitations);
router.get("/users", eventController.getAllUsersForInvite);
router.get("/:id", eventController.getEventById);
router.post("/", eventController.createEvent);
router.patch("/:id", eventController.updateEvent);
router.delete("/:id", eventController.deleteEvent);
router.patch("/:id/respond", eventController.respondToInvitation);

export default router;
