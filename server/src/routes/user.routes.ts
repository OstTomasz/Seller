import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { requirePasswordChange } from "../middleware/mustChangePassword.middleware";

const router = Router();

router.use(authenticate);
router.use(requirePasswordChange);

// Any logged in user can change their own password
router.patch("/me/password", userController.changePassword);

// All logged in users can read
router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);

// Director and deputy can create and manage users
router.post("/", requireRole("director", "deputy"), userController.createUser);
router.patch(
  "/:id",
  requireRole("director", "deputy"),
  userController.updateUser,
);
router.patch(
  "/:id/role",
  requireRole("director"),
  userController.updateUserRoleAndGrade,
);
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
