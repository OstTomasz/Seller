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
router.get("/:id/details", userProfileController.getUserWithProfile);
router.get("/:id", userController.getUserById);
router.patch("/:id/profile", userProfileController.upsertUserProfile);

// Director and deputy can create and manage users
router.post("/", requireRole("director", "deputy"), userController.createUser);
router.patch("/:id", requireRole("director", "deputy"), userController.updateUser);
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

export default router;
