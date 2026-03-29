import { Router } from "express";
import * as regionController from "../controllers/region.controller";

import { requireRole } from "../middleware/role.middleware";

const router = Router();

// getter - everyone
router.get("/", regionController.getRegions);
router.get("/:id", regionController.getRegionById);

// setter - director and deputy only (only director can create superregions)
router.post("/", requireRole("director", "deputy"), regionController.createRegion);
router.patch("/:id/name", requireRole("director", "deputy"), regionController.updateRegionName);
router.patch("/:id/deputy", requireRole("director"), regionController.updateRegionDeputy);
router.patch("/:id/parent", requireRole("director"), regionController.moveRegion);
router.delete("/:id", requireRole("director", "deputy"), regionController.deleteRegion);

export default router;
