// server/tests/integration/user.archive.routes.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import User from "../../src/models/User";
import Position from "../../src/models/Position";
import { clearDB, createTestContext, TestContext } from "../helpers";

let ctx: TestContext;

beforeEach(async () => {
  await clearDB();
  ctx = await createTestContext();
});

// ─── PATCH /api/users/:id/archive ─────────────────────────────────────────────

describe("PATCH /api/users/:id/archive", () => {
  it("director should archive a user with reason", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.salespersonId}/archive`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ reason: "Left the company" });

    expect(res.status).toBe(200);
    expect(res.body.user.isActive).toBe(false);
    expect(res.body.user.archivedReason).toBe("Left the company");
    expect(res.body.user.archivedPositionCode).toBeDefined();
    expect(res.body.user.archivedAt).toBeDefined();
  });

  it("archived user should be removed from position", async () => {
    await request(app)
      .patch(`/api/users/${ctx.salespersonId}/archive`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ reason: "Left the company" });

    const position = await Position.findById(ctx.salespersonPositionId);
    expect(position?.currentHolder).toBeNull();
  });

  it("deputy should archive user in own superregion", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.salespersonId}/archive`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`)
      .send({ reason: "Left the company" });

    expect(res.status).toBe(200);
  });

  it("should return 400 when reason is missing", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.salespersonId}/archive`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("should return 400 when trying to archive yourself", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.directorId}/archive`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ reason: "Self archive" });

    expect(res.status).toBe(400);
  });

  it("should return 400 when user is already archived", async () => {
    await User.findByIdAndUpdate(ctx.salespersonId, { isActive: false });

    const res = await request(app)
      .patch(`/api/users/${ctx.salespersonId}/archive`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ reason: "Already inactive" });

    expect(res.status).toBe(400);
  });

  it("advisor should NOT archive a user", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.salespersonId}/archive`)
      .set("Authorization", `Bearer ${ctx.advisorToken}`)
      .send({ reason: "Reason" });

    expect(res.status).toBe(403);
  });

  it("salesperson should NOT archive a user", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.advisorId}/archive`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ reason: "Reason" });

    expect(res.status).toBe(403);
  });
});

// ─── PATCH /api/users/:id/remove-position ─────────────────────────────────────

describe("PATCH /api/users/:id/remove-position", () => {
  it("director should remove user from position", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.salespersonId}/remove-position`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.position).toBeNull();
  });

  it("user should remain active after remove-position", async () => {
    await request(app)
      .patch(`/api/users/${ctx.salespersonId}/remove-position`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    const user = await User.findById(ctx.salespersonId);
    expect(user?.isActive).toBe(true);
    expect(user?.position).toBeNull();
  });

  it("position should be vacant after remove", async () => {
    await request(app)
      .patch(`/api/users/${ctx.salespersonId}/remove-position`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    const position = await Position.findById(ctx.salespersonPositionId);
    expect(position?.currentHolder).toBeNull();
  });

  it("deputy should remove user in own region", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.salespersonId}/remove-position`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`);

    expect(res.status).toBe(200);
  });

  it("advisor should NOT remove user from position", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.salespersonId}/remove-position`)
      .set("Authorization", `Bearer ${ctx.advisorToken}`);

    expect(res.status).toBe(403);
  });

  it("should return 400 when user has no position", async () => {
    await User.findByIdAndUpdate(ctx.salespersonId, { position: null });
    await Position.findByIdAndUpdate(ctx.salespersonPositionId, { currentHolder: null });

    const res = await request(app)
      .patch(`/api/users/${ctx.salespersonId}/remove-position`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(400);
  });
});

// ─── GET /api/users/archived ──────────────────────────────────────────────────

describe("GET /api/users/archived", () => {
  beforeEach(async () => {
    await User.findByIdAndUpdate(ctx.salespersonId, {
      isActive: false,
      archivedAt: new Date(),
      archivedReason: "Left the company",
      archivedPositionCode: "PO-2",
    });
  });

  it("director should get archived users", async () => {
    const res = await request(app)
      .get("/api/users/archived")
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0].isActive).toBe(false);
  });

  it("deputy should get archived users", async () => {
    const res = await request(app)
      .get("/api/users/archived")
      .set("Authorization", `Bearer ${ctx.deputyToken}`);

    expect(res.status).toBe(200);
  });

  it("advisor should NOT get archived users", async () => {
    const res = await request(app)
      .get("/api/users/archived")
      .set("Authorization", `Bearer ${ctx.advisorToken}`);

    expect(res.status).toBe(403);
  });

  it("salesperson should NOT get archived users", async () => {
    const res = await request(app)
      .get("/api/users/archived")
      .set("Authorization", `Bearer ${ctx.salespersonToken}`);

    expect(res.status).toBe(403);
  });

  it("should not expose passwords", async () => {
    const res = await request(app)
      .get("/api/users/archived")
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    res.body.users.forEach((u: { password?: string }) => {
      expect(u.password).toBeUndefined();
    });
  });
});
