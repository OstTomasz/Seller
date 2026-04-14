import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "../../src/utils/errors";

vi.mock("../../src/repositories/companyFile.repository", () => ({
  findAllFiles: vi.fn(),
  findFileById: vi.fn(),
  createFile: vi.fn(),
  deleteFileById: vi.fn(),
}));

vi.mock("../../src/repositories/companyNote.repository", () => ({
  findAllNotes: vi.fn(),
  createNote: vi.fn(),
  deleteNoteById: vi.fn(),
}));

vi.mock("../../src/repositories/notification.repository", () => ({
  createNotifications: vi.fn(),
}));

vi.mock("../../src/repositories/user.repository", () => ({
  findAllUsers: vi.fn(),
}));

import * as service from "../../src/services/companyDocument.service";
import * as fileRepo from "../../src/repositories/companyFile.repository";
import * as noteRepo from "../../src/repositories/companyNote.repository";
import * as notificationRepo from "../../src/repositories/notification.repository";
import * as userRepo from "../../src/repositories/user.repository";

describe("companyDocument.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns files and notes from repositories", async () => {
    vi.mocked(fileRepo.findAllFiles).mockResolvedValue([{ _id: "f1" }] as never);
    vi.mocked(noteRepo.findAllNotes).mockResolvedValue([{ _id: "n1" }] as never);

    await expect(service.getFiles()).resolves.toHaveLength(1);
    await expect(service.getNotes()).resolves.toHaveLength(1);
  });

  it("throws NotFoundError when file does not exist", async () => {
    vi.mocked(fileRepo.findFileById).mockResolvedValue(null);
    await expect(service.getFileById("missing")).rejects.toThrow(NotFoundError);
  });

  it("enforces director role for mutating operations", async () => {
    await expect(
      service.uploadFile({ name: "a", mimeType: "text/plain", size: 1, data: "ZA==" }, "u1", "advisor"),
    ).rejects.toThrow(ForbiddenError);

    await expect(service.deleteFile("f1", "salesperson")).rejects.toThrow(ForbiddenError);
    await expect(service.createNote("title", "content", "u1", "deputy")).rejects.toThrow(
      ForbiddenError,
    );
    await expect(service.deleteNote("n1", "advisor")).rejects.toThrow(ForbiddenError);
  });

  it("uploads file and notifies active users except creator", async () => {
    vi.mocked(fileRepo.createFile).mockResolvedValue({ name: "seed.pdf" } as never);
    vi.mocked(userRepo.findAllUsers).mockResolvedValue(
      [
        { _id: { toString: () => "u1" }, isActive: true },
        { _id: { toString: () => "u2" }, isActive: true },
        { _id: { toString: () => "u3" }, isActive: false },
      ] as never,
    );

    await service.uploadFile(
      { name: "seed.pdf", mimeType: "application/pdf", size: 1200, data: "ZA==" },
      "u1",
      "director",
    );

    expect(fileRepo.createFile).toHaveBeenCalledTimes(1);
    expect(notificationRepo.createNotifications).toHaveBeenCalledTimes(1);
  });

  it("creates note and sends notification", async () => {
    vi.mocked(noteRepo.createNote).mockResolvedValue({ _id: "n1" } as never);
    vi.mocked(userRepo.findAllUsers).mockResolvedValue(
      [{ _id: { toString: () => "u2" }, isActive: true }] as never,
    );

    await service.createNote("Ops", "Runbook updated", "u1", "director");
    expect(noteRepo.createNote).toHaveBeenCalledTimes(1);
    expect(notificationRepo.createNotifications).toHaveBeenCalledTimes(1);
  });

  it("does not notify when there are no active recipients", async () => {
    vi.mocked(noteRepo.createNote).mockResolvedValue({ _id: "n1" } as never);
    vi.mocked(userRepo.findAllUsers).mockResolvedValue(
      [
        { _id: { toString: () => "u1" }, isActive: true }, // creator only
        { _id: { toString: () => "u2" }, isActive: false },
      ] as never,
    );

    await service.createNote("Ops", "No recipients", "u1", "director");
    expect(notificationRepo.createNotifications).not.toHaveBeenCalled();
  });

  it("throws NotFoundError on deleting missing file/note", async () => {
    vi.mocked(fileRepo.deleteFileById).mockResolvedValue(null);
    vi.mocked(noteRepo.deleteNoteById).mockResolvedValue(null);

    await expect(service.deleteFile("missing-file", "director")).rejects.toThrow(NotFoundError);
    await expect(service.deleteNote("missing-note", "director")).rejects.toThrow(NotFoundError);
  });
});
