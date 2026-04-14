import { Router } from "express";
import * as ctrl from "../controllers/companyDocument.controller";

const router = Router();

router.get("/files", ctrl.getFiles);
router.get("/files/:id", ctrl.getFileById);
router.post("/files", ctrl.uploadFile);
router.delete("/files/:id", ctrl.deleteFile);
router.get("/notes", ctrl.getNotes);
router.post("/notes", ctrl.createNote);
router.delete("/notes/:id", ctrl.deleteNote);

export default router;
