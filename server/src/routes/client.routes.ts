import { Router } from "express";
import * as clientController from "../controllers/client.controller";

import { requireRole } from "../middleware/role.middleware";

const router = Router();

// All logged in users can read clients (filtered by role in service)
router.get("/", clientController.getClients);
router.get("/:id", clientController.getClientById);

// salesperson creating own, advisor creating for own region (must point a salesperson), deputy in superregion(must point a salesperson), director can create in any region, but point a salesperson (in this case - advisor is autocompleted)
router.post("/", clientController.createClient);

// Salesperson (own), advisor (region), deputy (superregion), director can update
router.patch("/:id", clientController.updateClient);

// Salesperson (own), deputy (superregion), director can change status
router.patch("/:id/status", clientController.updateClientStatus);

// Salesperson can request archive
router.patch(
  "/:id/archive-request",
  requireRole("salesperson"),
  clientController.requestArchive,
);

// Deputy and director can approve archive
router.patch(
  "/:id/archive-approve",
  requireRole("deputy", "director"),
  clientController.approveArchive,
);

// All logged in users can unarchive
router.patch("/:id/unarchive", clientController.unarchiveClient);

export default router;
