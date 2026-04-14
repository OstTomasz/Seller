import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../src/app";
import Position from "../../src/models/Position";
import {
  createTestClient,
  createTestContext,
  sampleAddress,
  TestContext,
} from "../helpers";

let ctx: TestContext;

beforeEach(async () => {
  ctx = await createTestContext();
});

// ─── GET /api/clients ─────────────────────────────────────────────────────────

describe("GET /api/clients", () => {
  it("director should see all clients", async () => {
    await createTestClient(ctx);
    await createTestClient(ctx, { companyName: "Another Company" });

    const res = await request(app)
      .get("/api/clients")
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.clients).toHaveLength(2);
  });

  it("salesperson should see only own clients", async () => {
    await createTestClient(ctx); // assigned to ctx.salespersonPositionId
    await createTestClient(ctx, {
      companyName: "Other Company",
      assignedTo: ctx.advisorPositionId, // different position
    });

    const res = await request(app)
      .get("/api/clients")
      .set("Authorization", `Bearer ${ctx.salespersonToken}`);

    expect(res.status).toBe(200);
    expect(res.body.clients).toHaveLength(1);
    expect(res.body.clients[0].companyName).toBe("Test Company");
  });

  it("advisor should see clients in own region", async () => {
    await createTestClient(ctx); // assignedAdvisor = ctx.advisorPositionId

    const res = await request(app)
      .get("/api/clients")
      .set("Authorization", `Bearer ${ctx.advisorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.clients).toHaveLength(1);
  });

  it("deputy should see clients in own superregion", async () => {
    await createTestClient(ctx);

    const res = await request(app)
      .get("/api/clients")
      .set("Authorization", `Bearer ${ctx.deputyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.clients).toHaveLength(1);
  });

  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/clients");
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/clients/:id ─────────────────────────────────────────────────────

describe("GET /api/clients/:id", () => {
  it("director should get client by id", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .get(`/api/clients/${client._id}`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.client.companyName).toBe("Test Company");
  });

  it("salesperson should get own client", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .get(`/api/clients/${client._id}`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`);

    expect(res.status).toBe(200);
  });

  it("salesperson should NOT get another salesperson's client", async () => {
    const otherPosition = await Position.create({
      code: "PO-99",
      region: ctx.regionId,
      type: "salesperson",
      currentHolder: null,
    });
    const client = await createTestClient(ctx, { assignedTo: otherPosition._id });

    const res = await request(app)
      .get(`/api/clients/${client._id}`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`);

    expect(res.status).toBe(403);
  });

  it("should return 404 for non-existent client", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .get(`/api/clients/${fakeId}`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── POST /api/clients ────────────────────────────────────────────────────────

describe("POST /api/clients", () => {
  it("salesperson should create a client", async () => {
    const res = await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({
        companyName: "New Company",
        addresses: [sampleAddress],
      });

    expect(res.status).toBe(201);
    expect(res.body.client.companyName).toBe("New Company");
    // advisor auto-assigned from region
    expect(res.body.client.assignedAdvisor).not.toBeNull();
  });

  it("advisor should create a client and assign to salesperson", async () => {
    const res = await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${ctx.advisorToken}`)
      .send({
        companyName: "New Company",
        addresses: [sampleAddress],
        salespersonPositionId: ctx.salespersonPositionId,
      });

    expect(res.status).toBe(201);
    expect(res.body.client.companyName).toBe("New Company");
  });

  it("director should create a client and assign to salesperson", async () => {
    const res = await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({
        companyName: "New Company",
        addresses: [sampleAddress],
        salespersonPositionId: ctx.salespersonPositionId,
      });

    expect(res.status).toBe(201);
  });

  it("advisor should NOT create a client for salesperson outside own region", async () => {
    const otherPosition = await Position.create({
      code: "SL-2",
      region: ctx.otherRegionId,
      type: "salesperson",
      currentHolder: null,
    });

    const res = await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${ctx.advisorToken}`)
      .send({
        companyName: "New Company",
        addresses: [sampleAddress],
        salespersonPositionId: otherPosition._id.toString(),
      });

    expect(res.status).toBe(403);
  });

  it("should return 400 when companyName is missing", async () => {
    const res = await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ addresses: [sampleAddress] });

    expect(res.status).toBe(400);
  });

  it("should return 400 when addresses are missing", async () => {
    const res = await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ companyName: "New Company" });

    expect(res.status).toBe(400);
  });
});

// ─── PATCH /api/clients/:id ───────────────────────────────────────────────────

describe("PATCH /api/clients/:id", () => {
  it("salesperson should update own client", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .patch(`/api/clients/${client._id}`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ companyName: "Updated Company" });

    expect(res.status).toBe(200);
    expect(res.body.client.companyName).toBe("Updated Company");
  });

  it("advisor should update client in own region", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .patch(`/api/clients/${client._id}`)
      .set("Authorization", `Bearer ${ctx.advisorToken}`)
      .send({ companyName: "Updated Company" });

    expect(res.status).toBe(200);
  });

  it("salesperson should NOT update another salesperson's client", async () => {
    const otherPosition = await Position.create({
      code: "PO-99",
      region: ctx.regionId,
      type: "salesperson",
      currentHolder: null,
    });
    const client = await createTestClient(ctx, { assignedTo: otherPosition._id });

    const res = await request(app)
      .patch(`/api/clients/${client._id}`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ companyName: "Updated Company" });

    expect(res.status).toBe(403);
  });

  it("director should update any client", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .patch(`/api/clients/${client._id}`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ companyName: "Updated Company" });

    expect(res.status).toBe(200);
  });
});

// ─── PATCH /api/clients/:id/status ───────────────────────────────────────────

describe("PATCH /api/clients/:id/status", () => {
  it("salesperson should change own client status to inactive", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .patch(`/api/clients/${client._id}/status`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ status: "inactive", inactivityReason: "No contact" });

    expect(res.status).toBe(200);
    expect(res.body.client.status).toBe("inactive");
    expect(res.body.client.inactivityReason).toBe("No contact");
  });

  it("should return 400 when inactivityReason is missing for inactive status", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .patch(`/api/clients/${client._id}/status`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ status: "inactive" });

    expect(res.status).toBe(400);
  });

  it("should return 400 when trying to set status to archived directly", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .patch(`/api/clients/${client._id}/status`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ status: "archived" });

    expect(res.status).toBe(400);
  });

  it("advisor should NOT change client status", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .patch(`/api/clients/${client._id}/status`)
      .set("Authorization", `Bearer ${ctx.advisorToken}`)
      .send({ status: "reminder" });

    expect(res.status).toBe(403);
  });

  it("deputy should change status of client in own superregion", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .patch(`/api/clients/${client._id}/status`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`)
      .send({ status: "reminder" });

    expect(res.status).toBe(200);
  });
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

  it("advisor should NOT submit archive request", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .patch(`/api/clients/${client._id}/archive-request`)
      .set("Authorization", `Bearer ${ctx.advisorToken}`)
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
    const client = await createTestClient(ctx); // no archiveRequest

    const res = await request(app)
      .patch(`/api/clients/${client._id}/archive-approve`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(400);
  });
});
