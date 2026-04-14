import * as fileRepo from "../repositories/companyFile.repository";
import * as noteRepo from "../repositories/companyNote.repository";
import * as notificationRepo from "../repositories/notification.repository";
import * as userRepo from "../repositories/user.repository";
import { ForbiddenError, NotFoundError } from "../utils/errors";
import { UserRole, NotificationType } from "../types";

/** Returns all files without base64 data */
export const getFiles = async () => fileRepo.findAllFiles();

/** Returns single file with base64 for download/preview */
export const getFileById = async (id: string) => {
  const file = await fileRepo.findFileById(id);
  if (!file) throw new NotFoundError("File not found");
  return file;
};

export const uploadFile = async (
  data: { name: string; mimeType: string; size: number; data: string },
  userId: string,
  userRole: UserRole,
): Promise<void> => {
  if (userRole !== "director") throw new ForbiddenError();
  const file = await fileRepo.createFile({
    ...data,
    createdBy: userId as unknown as import("mongoose").Types.ObjectId,
  });
  await notifyAll(userId, "company_file_added", `New file in Company documents: ${file.name}`);
};

export const deleteFile = async (id: string, userRole: UserRole): Promise<void> => {
  if (userRole !== "director") throw new ForbiddenError();
  const deleted = await fileRepo.deleteFileById(id);
  if (!deleted) throw new NotFoundError("File not found");
};

export const getNotes = async () => noteRepo.findAllNotes();

export const createNote = async (
  title: string,
  content: string,
  userId: string,
  userRole: UserRole,
) => {
  if (userRole !== "director") throw new ForbiddenError();
  await noteRepo.createNote({ title, content, createdBy: userId });
  await notifyAll(userId, "company_note_added", `New note in Company documents: ${title}`);
};

export const deleteNote = async (id: string, userRole: UserRole): Promise<void> => {
  if (userRole !== "director") throw new ForbiddenError();
  const deleted = await noteRepo.deleteNoteById(id);
  if (!deleted) throw new NotFoundError("Note not found");
};

/** Notifies all active users except the creator */
const notifyAll = async (
  excludeUserId: string,
  type: NotificationType,
  message: string,
): Promise<void> => {
  const users = await userRepo.findAllUsers();
  const recipients = users
    .filter((u) => u.isActive && u._id.toString() !== excludeUserId)
    .map((u) => u._id.toString());

  if (recipients.length === 0) return;
  await notificationRepo.createNotifications(
    recipients.map((userId) => ({
      userId,
      type,
      clientId: null,
      eventId: null,
      message,
      metadata: {},
    })),
  );
};
