import { Router } from "express";
import * as positionController from "../controllers/position.controller";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.get("/", positionController.getPositions);
router.post("/", requireRole("director", "deputy"), positionController.createPosition);
router.delete("/:id", requireRole("director", "deputy"), positionController.deletePosition);

export default router;
