import { Request, Response } from "express";
import { wrapAsync } from "../utils/wrapAsync";
import * as service from "../services/companyDocument.service";
import { BadRequestError } from "../utils/errors";

export const getFiles = wrapAsync(async (_req: Request, res: Response) => {
  const files = await service.getFiles();
  res.json({ files });
});

export const getFileById = wrapAsync(async (req: Request, res: Response) => {
  const file = await service.getFileById(req.params["id"] as string);
  res.json({ file });
});

export const uploadFile = wrapAsync(async (req: Request, res: Response) => {
  const { name, mimeType, size, data } = req.body as {
    name: string;
    mimeType: string;
    size: number;
    data: string;
  };
  if (!name?.trim() || !mimeType || !size || !data) throw new BadRequestError("Missing fields");
  if (size > 1024 * 1024) throw new BadRequestError("File too large (max 1MB)");
  await service.uploadFile({ name: name.trim(), mimeType, size, data }, req.userId!, req.userRole!);
  res.status(201).json({ message: "File uploaded" });
});

export const deleteFile = wrapAsync(async (req: Request, res: Response) => {
  await service.deleteFile(req.params["id"] as string, req.userRole!);
  res.json({ message: "File deleted" });
});

export const getNotes = wrapAsync(async (_req: Request, res: Response) => {
  const notes = await service.getNotes();
  res.json({ notes });
});

export const createNote = wrapAsync(async (req: Request, res: Response) => {
  const { title, content } = req.body as { title: string; content: string };
  if (!title?.trim() || !content?.trim())
    throw new BadRequestError("Title and content are required");
  await service.createNote(title.trim(), content.trim(), req.userId!, req.userRole!);
  res.status(201).json({ message: "Note added" });
});

export const deleteNote = wrapAsync(async (req: Request, res: Response) => {
  await service.deleteNote(req.params["id"] as string, req.userRole!);
  res.json({ message: "Note deleted" });
});
