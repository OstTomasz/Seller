import { Router } from "express";
import * as regionController from "../controllers/region.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.use(authenticate);

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
