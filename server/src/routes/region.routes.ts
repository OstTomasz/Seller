import { Router } from "express";
import * as regionController from "../controllers/region.controller";

import { requireRole } from "../middleware/role.middleware";

const router = Router();

// Odczyt — każdy zalogowany
router.get("/", regionController.getRegions);
router.get("/:id", regionController.getRegionById);

// Zapis — director i deputy (szczegółowa kontrola w serwisie)
router.post(
  "/",
  requireRole("director", "deputy"),
  regionController.createRegion,
);
router.patch(
  "/:id/name",
  requireRole("director", "deputy"),
  regionController.updateRegionName,
);
router.patch(
  "/:id/deputy",
  requireRole("director"),
  regionController.updateRegionDeputy,
);
router.delete(
  "/:id",
  requireRole("director", "deputy"),
  regionController.deleteRegion,
);

export default router;
