import { beforeEach, describe, expect, it, vi } from "vitest";
import { BadRequestError, NotFoundError } from "../../src/utils/errors";

vi.mock("../../src/repositories/notification.repository", () => ({
  deleteNotificationById: vi.fn(),
  markNotificationAsRead: vi.fn(),
  createNotifications: vi.fn(),
}));

vi.mock("../../src/repositories/position.repository", () => ({
  findPositionById: vi.fn(),
  findAdvisorPositionByRegionId: vi.fn(),
}));

vi.mock("../../src/repositories/region.repository", () => ({
  findRegionById: vi.fn(),
}));

vi.mock("../../src/repositories/user.repository", () => ({
  findUsersByRole: vi.fn(),
}));

vi.mock("../../src/repositories/client.repository", () => ({
  findClientById: vi.fn(),
}));

import * as notificationService from "../../src/services/notification.service";
import * as notificationRepository from "../../src/repositories/notification.repository";
import * as positionRepository from "../../src/repositories/position.repository";
import * as regionRepository from "../../src/repositories/region.repository";
import * as userRepository from "../../src/repositories/user.repository";
import * as clientRepository from "../../src/repositories/client.repository";

describe("notification.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when deleting non-existing notification", async () => {
    vi.mocked(notificationRepository.deleteNotificationById).mockResolvedValue(false);

    await expect(notificationService.deleteNotification("n1", "u1")).rejects.toThrow(NotFoundError);
  });

  it("throws when marking notification as read and it does not exist", async () => {
    vi.mocked(notificationRepository.markNotificationAsRead).mockResolvedValue(null);

    await expect(notificationService.markAsRead("n1", "u1")).rejects.toThrow(NotFoundError);
  });

  it("sends archive approved notification when position has no region", async () => {
    vi.mocked(positionRepository.findPositionById).mockResolvedValue({
      currentHolder: { toString: () => "sales-1" },
      region: null,
    } as never);

    await notificationService.notifyClientArchived("c1", "Client", "p1", "Reason");

    expect(notificationRepository.createNotifications).toHaveBeenCalledTimes(1);
  });

  it("adds deputy recipient when unarchiving and superregion deputy exists", async () => {
    vi.mocked(positionRepository.findPositionById)
      .mockResolvedValueOnce({
        currentHolder: { toString: () => "sales-1" },
        region: { toString: () => "r1" },
      } as never)
      .mockResolvedValueOnce({
        currentHolder: { toString: () => "deputy-1" },
      } as never);
    vi.mocked(positionRepository.findAdvisorPositionByRegionId).mockResolvedValue({
      currentHolder: { toString: () => "advisor-1" },
    } as never);
    vi.mocked(regionRepository.findRegionById)
      .mockResolvedValueOnce({ parentRegion: { toString: () => "sr1" } } as never)
      .mockResolvedValueOnce({ deputy: { toString: () => "dp-pos-1" } } as never);

    await notificationService.notifyClientUnarchived("c1", "Client", "p1", "Reason");

    expect(notificationRepository.createNotifications).toHaveBeenCalledTimes(1);
    const notificationsArg = vi.mocked(notificationRepository.createNotifications).mock.calls[0]?.[0];
    const recipients = notificationsArg?.map((entry) => entry.userId) ?? [];
    expect(recipients).toContain("sales-1");
    expect(recipients).toContain("advisor-1");
    expect(recipients).toContain("deputy-1");
  });

  it("throws when unarchive request is sent for missing client", async () => {
    vi.mocked(clientRepository.findClientById).mockResolvedValue(null);

    await expect(notificationService.notifyUnarchiveRequest("c1", "u1")).rejects.toThrow(NotFoundError);
  });

  it("throws when unarchive request is sent for active client", async () => {
    vi.mocked(clientRepository.findClientById).mockResolvedValue({
      status: "active",
    } as never);

    await expect(notificationService.notifyUnarchiveRequest("c1", "u1")).rejects.toThrow(BadRequestError);
  });
});
