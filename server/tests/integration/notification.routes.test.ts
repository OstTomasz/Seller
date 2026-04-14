import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import {
  createTestClient,
  createTestContext,
  createTestNotification,
  TestContext,
} from "../helpers";
import Notification from "../../src/models/Notification";

let ctx: TestContext;

beforeEach(async () => {
  ctx = await createTestContext();
});

// ─── GET /api/notifications ───────────────────────────────────────────────────

describe("GET /api/notifications", () => {
  it("should return own notifications", async () => {
    const client = await createTestClient(ctx);
    await createTestNotification(ctx.directorId, client._id.toString());

    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(1);
  });

  it("should NOT return other users notifications", async () => {
    const client = await createTestClient(ctx);
    await createTestNotification(ctx.directorId, client._id.toString());

    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${ctx.salespersonToken}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(0);
  });

  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/notifications");
    expect(res.status).toBe(401);
  });
});

// ─── DELETE /api/notifications/:id ───────────────────────────────────────────

describe("DELETE /api/notifications/:id", () => {
  it("owner should delete own notification", async () => {
    const client = await createTestClient(ctx);
    const notification = await createTestNotification(ctx.directorId, client._id.toString());

    const res = await request(app)
      .delete(`/api/notifications/${notification._id}`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(200);
    expect(await Notification.findById(notification._id)).toBeNull();
  });

  it("should NOT delete another user's notification", async () => {
    const client = await createTestClient(ctx);
    const notification = await createTestNotification(ctx.directorId, client._id.toString());

    const res = await request(app)
      .delete(`/api/notifications/${notification._id}`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/notifications/:id/read ───────────────────────────────────────

describe("PATCH /api/notifications/:id/read", () => {
  it("should mark notification as read", async () => {
    const client = await createTestClient(ctx);
    const notification = await createTestNotification(ctx.directorId, client._id.toString(), false);

    const res = await request(app)
      .patch(`/api/notifications/${notification._id}/read`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.notification.read).toBe(true);
  });

  it("should NOT mark another user's notification as read", async () => {
    const client = await createTestClient(ctx);
    const notification = await createTestNotification(ctx.directorId, client._id.toString(), false);

    const res = await request(app)
      .patch(`/api/notifications/${notification._id}/read`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/notifications/:id/unread ─────────────────────────────────────

describe("PATCH /api/notifications/:id/unread", () => {
  it("should mark notification as unread", async () => {
    const client = await createTestClient(ctx);
    const notification = await createTestNotification(ctx.directorId, client._id.toString(), true);

    const res = await request(app)
      .patch(`/api/notifications/${notification._id}/unread`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.notification.read).toBe(false);
  });
});

// ─── POST /api/notifications/unarchive-request ───────────────────────────────

describe("POST /api/notifications/unarchive-request", () => {
  it("should send unarchive request for archived client", async () => {
    const client = await createTestClient(ctx, { status: "archived" });

    const res = await request(app)
      .post("/api/notifications/unarchive-request")
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ clientId: client._id.toString() });

    expect(res.status).toBe(200);

    const notification = await Notification.findOne({
      clientId: client._id,
      type: "unarchive_request",
      userId: ctx.directorId,
    });
    expect(notification).not.toBeNull();
  });

  it("should return 400 when client is not archived", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .post("/api/notifications/unarchive-request")
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ clientId: client._id.toString() });

    expect(res.status).toBe(400);
  });

  it("should return 400 when clientId is missing", async () => {
    const res = await request(app)
      .post("/api/notifications/unarchive-request")
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("should return 404 when client does not exist", async () => {
    const res = await request(app)
      .post("/api/notifications/unarchive-request")
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ clientId: new (await import("mongoose")).Types.ObjectId().toString() });

    expect(res.status).toBe(404);
  });
});
