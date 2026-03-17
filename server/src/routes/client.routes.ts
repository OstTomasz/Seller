import { Router } from "express";
import * as clientController from "../controllers/client.controller";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

// ── Clients ───────────────────────────────────────────────────────────────────
router.get("/", clientController.getClients);
router.get("/:id", clientController.getClientById);
router.post("/", clientController.createClient);

router.patch("/:id", clientController.updateClient);
router.patch("/:id/status", clientController.updateClientStatus);
router.patch("/:id/salesperson", clientController.updateClientSalesperson);

router.patch("/:id/archive-request", requireRole("salesperson"), clientController.requestArchive);
router.patch(
  "/:id/archive-approve",
  requireRole("deputy", "director"),
  clientController.approveArchive,
);
router.patch("/:id/unarchive", clientController.unarchiveClient);

// ── Notes ─────────────────────────────────────────────────────────────────────
router.post("/:id/notes", clientController.addNote);
router.patch("/:id/notes/:noteId", clientController.updateNote);
router.delete("/:id/notes/:noteId", clientController.deleteNote);

// ── Addresses ─────────────────────────────────────────────────────────────────
router.post("/:id/addresses", clientController.addAddress);
router.patch("/:id/addresses/:addressId", clientController.updateAddress);
router.delete("/:id/addresses/:addressId", clientController.deleteAddress);

// ── Contacts ──────────────────────────────────────────────────────────────────
router.post("/:id/addresses/:addressId/contacts", clientController.addContact);
router.patch("/:id/addresses/:addressId/contacts/:contactId", clientController.updateContact);
router.delete("/:id/addresses/:addressId/contacts/:contactId", clientController.deleteContact);

export default router;
