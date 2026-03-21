import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../src/app";
import { clearDB, createTestClient, createTestContext, TestContext } from "../helpers";
import Notification from "../../src/models/Notification";

let ctx: TestContext;

beforeEach(async () => {
  await clearDB();
  ctx = await createTestContext();
});

// ─── PATCH /api/clients/:id/archive-request ───────────────────────────────────

describe("PATCH /api/clients/:id/archive-request", () => {
  it("salesperson should submit archive request", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .patch(`/api/clients/${client._id}/archive-request`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ reason: "Client closed business" });

    expect(res.status).toBe(200);
    expect(res.body.client.archiveRequest.reason).toBe("Client closed business");
    expect(res.body.client.archiveRequest.requestedAt).not.toBeNull();
  });

  it("deputy should submit archive request", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .patch(`/api/clients/${client._id}/archive-request`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`)
      .send({ reason: "Client closed business" });

    expect(res.status).toBe(200);
    expect(res.body.client.archiveRequest.reason).toBe("Client closed business");
  });

  it("advisor should NOT submit archive request", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .patch(`/api/clients/${client._id}/archive-request`)
      .set("Authorization", `Bearer ${ctx.advisorToken}`)
      .send({ reason: "Client closed business" });

    expect(res.status).toBe(403);
  });

  it("director should NOT submit archive request", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .patch(`/api/clients/${client._id}/archive-request`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ reason: "Client closed business" });

    expect(res.status).toBe(403);
  });

  it("should return 400 when reason is missing", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .patch(`/api/clients/${client._id}/archive-request`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("should send notifications to advisor, deputy and director", async () => {
    const client = await createTestClient(ctx);

    await request(app)
      .patch(`/api/clients/${client._id}/archive-request`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ reason: "Client closed business" });

    const notifications = await Notification.find({
      clientId: client._id,
      type: "archive_request",
    });
    const recipientIds = notifications.map((n) => n.userId.toString());

    expect(recipientIds).toContain(ctx.advisorId);
    expect(recipientIds).toContain(ctx.deputyId);
    expect(recipientIds).toContain(ctx.directorId);
  });

  it("deputy archive request should notify salesperson, advisor and director", async () => {
    const client = await createTestClient(ctx);

    await request(app)
      .patch(`/api/clients/${client._id}/archive-request`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`)
      .send({ reason: "Client closed business" });

    const notifications = await Notification.find({
      clientId: client._id,
      type: "archive_request",
    });
    const recipientIds = notifications.map((n) => n.userId.toString());

    expect(recipientIds).toContain(ctx.salespersonId);
    expect(recipientIds).toContain(ctx.advisorId);
    expect(recipientIds).toContain(ctx.directorId);
    expect(recipientIds).not.toContain(ctx.deputyId);
  });

  it("should return 400 when client is already archived", async () => {
    const client = await createTestClient(ctx, { status: "archived" });

    const res = await request(app)
      .patch(`/api/clients/${client._id}/archive-request`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ reason: "Client closed business" });

    expect(res.status).toBe(400);
  });
});

// ─── PATCH /api/clients/:id/archive-approve ──────────────────────────────────

describe("PATCH /api/clients/:id/archive-approve", () => {
  it("director should approve archive request", async () => {
    const client = await createTestClient(ctx, {
      archiveRequest: {
        requestedAt: new Date(),
        requestedBy: new mongoose.Types.ObjectId(),
        reason: "Client closed business",
      },
    });

    const res = await request(app)
      .patch(`/api/clients/${client._id}/archive-approve`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.client.status).toBe("archived");
    expect(res.body.client.archiveRequest.requestedAt).toBeNull();
  });

  it("deputy should NOT approve archive request", async () => {
    const client = await createTestClient(ctx, {
      archiveRequest: {
        requestedAt: new Date(),
        requestedBy: new mongoose.Types.ObjectId(),
        reason: "Client closed business",
      },
    });

    const res = await request(app)
      .patch(`/api/clients/${client._id}/archive-approve`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`);

    expect(res.status).toBe(403);
  });

  it("salesperson should NOT approve archive request", async () => {
    const client = await createTestClient(ctx, {
      archiveRequest: {
        requestedAt: new Date(),
        requestedBy: new mongoose.Types.ObjectId(),
        reason: "Client closed business",
      },
    });

    const res = await request(app)
      .patch(`/api/clients/${client._id}/archive-approve`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`);

    expect(res.status).toBe(403);
  });

  it("should return 400 when no archive request exists", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .patch(`/api/clients/${client._id}/archive-approve`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(400);
  });

  it("should delete archive_request notifications on approve", async () => {
    const client = await createTestClient(ctx, {
      archiveRequest: {
        requestedAt: new Date(),
        requestedBy: new mongoose.Types.ObjectId(),
        reason: "Client closed business",
      },
    });

    await Notification.create({
      userId: ctx.directorId,
      type: "archive_request",
      clientId: client._id,
      message: "Archive request",
    });

    await request(app)
      .patch(`/api/clients/${client._id}/archive-approve`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    const remaining = await Notification.find({ clientId: client._id, type: "archive_request" });
    expect(remaining).toHaveLength(0);
  });

  it("advisor should NOT approve archive request", async () => {
    const client = await createTestClient(ctx, {
      archiveRequest: {
        requestedAt: new Date(),
        requestedBy: new mongoose.Types.ObjectId(),
        reason: "Client closed business",
      },
    });

    const res = await request(app)
      .patch(`/api/clients/${client._id}/archive-approve`)
      .set("Authorization", `Bearer ${ctx.advisorToken}`);

    expect(res.status).toBe(403);
  });
});

// ─── PATCH /api/clients/:id/archive-reject ────────────────────────────────────

describe("PATCH /api/clients/:id/archive-reject", () => {
  it("director should reject archive request", async () => {
    const client = await createTestClient(ctx, {
      archiveRequest: {
        requestedAt: new Date(),
        requestedBy: new mongoose.Types.ObjectId(),
        reason: "Client closed business",
      },
    });

    const res = await request(app)
      .patch(`/api/clients/${client._id}/archive-reject`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ reason: "Client is still active" });

    expect(res.status).toBe(200);
    expect(res.body.client.status).toBe("active");
    expect(res.body.client.archiveRequest.requestedAt).toBeNull();
  });

  it("salesperson should NOT reject archive request", async () => {
    const client = await createTestClient(ctx, {
      archiveRequest: {
        requestedAt: new Date(),
        requestedBy: new mongoose.Types.ObjectId(),
        reason: "Client closed business",
      },
    });

    const res = await request(app)
      .patch(`/api/clients/${client._id}/archive-reject`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ reason: "Client is still active" });

    expect(res.status).toBe(403);
  });

  it("should return 400 when reason is missing", async () => {
    const client = await createTestClient(ctx, {
      archiveRequest: {
        requestedAt: new Date(),
        requestedBy: new mongoose.Types.ObjectId(),
        reason: "Client closed business",
      },
    });

    const res = await request(app)
      .patch(`/api/clients/${client._id}/archive-reject`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("should send archive_rejected notification to salesperson", async () => {
    const client = await createTestClient(ctx, {
      archiveRequest: {
        requestedAt: new Date(),
        requestedBy: new mongoose.Types.ObjectId(),
        reason: "Client closed business",
      },
    });

    await request(app)
      .patch(`/api/clients/${client._id}/archive-reject`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ reason: "Client is still active" });

    const notification = await Notification.findOne({
      clientId: client._id,
      type: "archive_rejected",
      userId: ctx.salespersonId,
    });

    expect(notification).not.toBeNull();
    expect(notification?.metadata?.rejectionReason).toBe("Client is still active");
  });
  it("deputy should NOT reject archive request", async () => {
    const client = await createTestClient(ctx, {
      archiveRequest: {
        requestedAt: new Date(),
        requestedBy: new mongoose.Types.ObjectId(),
        reason: "Client closed business",
      },
    });

    const res = await request(app)
      .patch(`/api/clients/${client._id}/archive-reject`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`)
      .send({ reason: "Still active" });

    expect(res.status).toBe(403);
  });

  it("should return 400 when no archive request exists", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .patch(`/api/clients/${client._id}/archive-reject`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ reason: "Still active" });

    expect(res.status).toBe(400);
  });
});

// ─── PATCH /api/clients/:id/direct-archive ────────────────────────────────────

describe("PATCH /api/clients/:id/direct-archive", () => {
  it("director should archive client directly", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .patch(`/api/clients/${client._id}/direct-archive`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ reason: "Fraud detected" });

    expect(res.status).toBe(200);
    expect(res.body.client.status).toBe("archived");
  });

  it("deputy should NOT archive client directly", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .patch(`/api/clients/${client._id}/direct-archive`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`)
      .send({ reason: "Fraud detected" });

    expect(res.status).toBe(403);
  });

  it("should return 400 when reason is missing", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .patch(`/api/clients/${client._id}/direct-archive`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("should return 400 when client is already archived", async () => {
    const client = await createTestClient(ctx, { status: "archived" });

    const res = await request(app)
      .patch(`/api/clients/${client._id}/direct-archive`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ reason: "Fraud detected" });

    expect(res.status).toBe(400);
  });
});

// ─── PATCH /api/clients/:id/unarchive ────────────────────────────────────────

describe("PATCH /api/clients/:id/unarchive", () => {
  it("director should unarchive client with reason", async () => {
    const client = await createTestClient(ctx, { status: "archived" });

    const res = await request(app)
      .patch(`/api/clients/${client._id}/unarchive`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ reason: "Client renewed contract" });

    expect(res.status).toBe(200);
    expect(res.body.client.status).toBe("active");
  });

  it("salesperson should NOT unarchive client", async () => {
    const client = await createTestClient(ctx, { status: "archived" });

    const res = await request(app)
      .patch(`/api/clients/${client._id}/unarchive`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ reason: "Client renewed contract" });

    expect(res.status).toBe(403);
  });

  it("deputy should NOT unarchive client", async () => {
    const client = await createTestClient(ctx, { status: "archived" });

    const res = await request(app)
      .patch(`/api/clients/${client._id}/unarchive`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`)
      .send({ reason: "Client renewed contract" });

    expect(res.status).toBe(403);
  });

  it("should return 400 when reason is missing", async () => {
    const client = await createTestClient(ctx, { status: "archived" });

    const res = await request(app)
      .patch(`/api/clients/${client._id}/unarchive`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("should return 400 when client is not archived", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .patch(`/api/clients/${client._id}/unarchive`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ reason: "Client renewed contract" });

    expect(res.status).toBe(400);
  });

  it("should send unarchive notification to salesperson", async () => {
    const client = await createTestClient(ctx, { status: "archived" });

    await request(app)
      .patch(`/api/clients/${client._id}/unarchive`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ reason: "Client renewed contract" });

    const notification = await Notification.findOne({
      clientId: client._id,
      type: "client_unarchived",
      userId: ctx.salespersonId,
    });

    expect(notification).not.toBeNull();
    expect(notification?.metadata?.reason).toBe("Client renewed contract");
  });

  it("should delete unarchive_request notifications on approve", async () => {
    const client = await createTestClient(ctx, { status: "archived" });

    await Notification.create({
      userId: ctx.directorId,
      type: "unarchive_request",
      clientId: client._id,
      message: "Unarchive request",
    });

    await request(app)
      .patch(`/api/clients/${client._id}/unarchive`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ reason: "Client renewed contract" });

    const remaining = await Notification.find({ clientId: client._id, type: "unarchive_request" });
    expect(remaining).toHaveLength(0);
  });
  it("advisor should NOT unarchive client", async () => {
    const client = await createTestClient(ctx, { status: "archived" });

    const res = await request(app)
      .patch(`/api/clients/${client._id}/unarchive`)
      .set("Authorization", `Bearer ${ctx.advisorToken}`)
      .send({ reason: "Client renewed contract" });

    expect(res.status).toBe(403);
  });
});

// ─── PATCH /api/clients/:id/unarchive-reject ─────────────────────────────────

describe("PATCH /api/clients/:id/unarchive-reject", () => {
  it("director should reject unarchive request", async () => {
    const client = await createTestClient(ctx, { status: "archived" });

    const res = await request(app)
      .patch(`/api/clients/${client._id}/unarchive-reject`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ reason: "Client still has outstanding debt" });

    expect(res.status).toBe(200);
  });

  it("salesperson should NOT reject unarchive request", async () => {
    const client = await createTestClient(ctx, { status: "archived" });

    const res = await request(app)
      .patch(`/api/clients/${client._id}/unarchive-reject`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ reason: "Client still has outstanding debt" });

    expect(res.status).toBe(403);
  });

  it("should return 400 when reason is missing", async () => {
    const client = await createTestClient(ctx, { status: "archived" });

    const res = await request(app)
      .patch(`/api/clients/${client._id}/unarchive-reject`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("should return 400 when client is not archived", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .patch(`/api/clients/${client._id}/unarchive-reject`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ reason: "Client still has outstanding debt" });

    expect(res.status).toBe(400);
  });

  it("should send unarchive_rejected notification to salesperson", async () => {
    const client = await createTestClient(ctx, { status: "archived" });

    await request(app)
      .patch(`/api/clients/${client._id}/unarchive-reject`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ reason: "Client still has outstanding debt" });

    const notification = await Notification.findOne({
      clientId: client._id,
      type: "unarchive_rejected",
      userId: ctx.salespersonId,
    });

    expect(notification).not.toBeNull();
    expect(notification?.metadata?.rejectionReason).toBe("Client still has outstanding debt");
  });
  it("advisor should NOT reject unarchive request", async () => {
    const client = await createTestClient(ctx, { status: "archived" });

    const res = await request(app)
      .patch(`/api/clients/${client._id}/unarchive-reject`)
      .set("Authorization", `Bearer ${ctx.advisorToken}`)
      .send({ reason: "Still has debt" });

    expect(res.status).toBe(403);
  });

  it("should send unarchive_rejected notification to advisor and deputy", async () => {
    const client = await createTestClient(ctx, { status: "archived" });

    await request(app)
      .patch(`/api/clients/${client._id}/unarchive-reject`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ reason: "Still has debt" });

    const notifications = await Notification.find({
      clientId: client._id,
      type: "unarchive_rejected",
    });
    const recipientIds = notifications.map((n) => n.userId.toString());

    expect(recipientIds).toContain(ctx.advisorId);
    expect(recipientIds).toContain(ctx.deputyId);
  });
});
