import { Router } from "express";
import * as positionController from "../controllers/position.controller";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.get("/", positionController.getPositions);
router.post("/", requireRole("director", "deputy"), positionController.createPosition);
router.patch("/:id/code", requireRole("director", "deputy"), positionController.updateCode);
router.delete("/:id", requireRole("director", "deputy"), positionController.deletePosition);
router.get("/:id/history", positionController.getPositionHistory);

export default router;
