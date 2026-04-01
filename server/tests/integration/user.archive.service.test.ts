// server/tests/unit/user.archive.service.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { clearDB, createTestDB, TestDB } from "../helpers";
import * as userService from "../../src/services/user.service";
import User from "../../src/models/User";
import Position from "../../src/models/Position";
import PositionHistory from "../../src/models/PositionHistory";

let ctx: TestDB;

beforeEach(async () => {
  await clearDB();
  ctx = await createTestDB();
});

// ─── archiveUser ──────────────────────────────────────────────────────────────

describe("archiveUser", () => {
  it("director should archive a user with reason", async () => {
    const result = await userService.archiveUser(
      ctx.salespersonId,
      "Left the company",
      ctx.directorId,
      "director",
    );

    expect(result.isActive).toBe(false);
    expect(result.archivedReason).toBe("Left the company");
    expect(result.archivedAt).toBeDefined();
  });

  it("archived user should have position code saved", async () => {
    const result = await userService.archiveUser(
      ctx.salespersonId,
      "Left the company",
      ctx.directorId,
      "director",
    );

    expect(result.archivedPositionCode).toBeDefined();
    expect(typeof result.archivedPositionCode).toBe("string");
  });

  it("archived user should be removed from position", async () => {
    await userService.archiveUser(
      ctx.salespersonId,
      "Left the company",
      ctx.directorId,
      "director",
    );

    const position = await Position.findById(ctx.salespersonPositionId);
    expect(position?.currentHolder).toBeNull();
  });

  it("archive should close position history entry", async () => {
    await PositionHistory.create({
      positionId: ctx.salespersonPositionId,
      userId: ctx.salespersonId,
      assignedAt: new Date("2025-01-01"),
      removedAt: null,
    });

    await userService.archiveUser(
      ctx.salespersonId,
      "Left the company",
      ctx.directorId,
      "director",
    );

    const history = await PositionHistory.findOne({
      positionId: ctx.salespersonPositionId,
      userId: ctx.salespersonId,
    });
    expect(history?.removedAt).toBeDefined();
  });

  it("should throw BadRequestError when archiving yourself", async () => {
    await expect(
      userService.archiveUser(ctx.directorId, "Self archive", ctx.directorId, "director"),
    ).rejects.toThrow("Cannot archive yourself");
  });

  it("should throw BadRequestError when user is already archived", async () => {
    await User.findByIdAndUpdate(ctx.salespersonId, { isActive: false });

    await expect(
      userService.archiveUser(ctx.salespersonId, "Already inactive", ctx.directorId, "director"),
    ).rejects.toThrow("already archived");
  });

  it("deputy should archive user in own superregion", async () => {
    const result = await userService.archiveUser(
      ctx.salespersonId,
      "Left the company",
      ctx.deputyId,
      "deputy",
    );

    expect(result.isActive).toBe(false);
  });

  it("deputy should NOT archive user outside own superregion", async () => {
    const otherUser = await User.create({
      firstName: "Other",
      lastName: "User",
      email: "other@seller.com",
      password: "password123",
      role: "director",
      mustChangePassword: false,
      isActive: true,
      position: null,
    });

    await expect(
      userService.archiveUser(ctx.directorId, "Reason", ctx.deputyId, "deputy"),
    ).rejects.toThrow();
  });
});

// ─── removeUserFromPosition ───────────────────────────────────────────────────

describe("removeUserFromPosition", () => {
  it("should remove user from position and keep active", async () => {
    const result = await userService.removeUserFromPosition(
      ctx.salespersonId,
      ctx.directorId,
      "director",
    );

    expect(result.position).toBeNull();
    expect(result.isActive).toBe(true);
  });

  it("should clear position currentHolder", async () => {
    await userService.removeUserFromPosition(ctx.salespersonId, ctx.directorId, "director");

    const position = await Position.findById(ctx.salespersonPositionId);
    expect(position?.currentHolder).toBeNull();
  });

  it("should throw BadRequestError when user has no position", async () => {
    await User.findByIdAndUpdate(ctx.salespersonId, { position: null });

    await expect(
      userService.removeUserFromPosition(ctx.salespersonId, ctx.directorId, "director"),
    ).rejects.toThrow("User has no position");
  });

  it("deputy should remove user in own region", async () => {
    const result = await userService.removeUserFromPosition(
      ctx.salespersonId,
      ctx.deputyId,
      "deputy",
    );

    expect(result.position).toBeNull();
  });
});
