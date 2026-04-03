import { Router } from "express";
import * as userController from "../controllers/user.controller";
import * as userProfileController from "../controllers/userProfile.controller";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

// Any logged in user can change their own password
router.patch("/me/password", userController.changePassword);

// All logged in users can read
router.get("/", userController.getUsers);
router.get(
  "/salespersons",
  requireRole("director", "deputy", "advisor"),
  userController.getSalespersons,
);
router.get("/for-structure", userController.getUsersForStructure);
router.get("/me/profile", userProfileController.getMyProfile);
router.patch("/me/profile", userProfileController.upsertMyProfile);
router.get("/archived", requireRole("director", "deputy"), userController.getArchivedUsers);
router.get("/:id/details", userProfileController.getUserWithProfile);
router.get("/:id", userController.getUserById);
router.patch("/:id/profile", userProfileController.upsertUserProfile);
router.patch("/:id/unarchive", requireRole("director"), userController.unarchiveUser);

// Director and deputy can create and manage users
router.post("/", requireRole("director", "deputy"), userController.createUser);
router.post("/:id/notes", requireRole("director", "deputy"), userController.addUserNote);
router.patch(
  "/:id/notes/:noteId",
  requireRole("director", "deputy"),
  userController.updateUserNote,
);
router.delete(
  "/:id/notes/:noteId",
  requireRole("director", "deputy"),
  userController.deleteUserNote,
);
router.patch("/:id/role", requireRole("director"), userController.updateUserRoleAndGrade);
router.patch(
  "/:id/toggle-active",
  requireRole("director", "deputy"),
  userController.toggleUserActive,
);
router.patch(
  "/:id/reset-password",
  requireRole("director", "deputy"),
  userController.resetPassword,
);
router.patch(
  "/:id/remove-position",
  requireRole("director", "deputy"),
  userController.removeFromPosition,
);
router.patch("/:id/archive", requireRole("director", "deputy"), userController.archiveUser);

router.patch("/:id", requireRole("director", "deputy"), userController.updateUser);

export default router;
