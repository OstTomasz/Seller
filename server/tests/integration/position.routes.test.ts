// server/tests/integration/position.routes.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import Position from "../../src/models/Position";
import PositionHistory from "../../src/models/PositionHistory";
import { createTestContext, TestContext } from "../helpers";

let ctx: TestContext;

beforeEach(async () => {
  ctx = await createTestContext();
});

// ─── GET /api/positions ───────────────────────────────────────────────────────

describe("GET /api/positions", () => {
  const getPositionsWithRetry = async () => {
    try {
      return await request(app)
        .get("/api/positions")
        .set("Authorization", `Bearer ${ctx.directorToken}`);
    } catch (error) {
      if (error instanceof Error && /Parse Error/.test(error.message)) {
        return request(app).get("/api/positions").set("Authorization", `Bearer ${ctx.directorToken}`);
      }
      throw error;
    }
  };

  it("should return all positions for logged in user", async () => {
    const res = await getPositionsWithRetry();

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.positions)).toBe(true);
  });

  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/positions");
    expect(res.status).toBe(401);
  });
});

// ─── POST /api/positions ──────────────────────────────────────────────────────

describe("POST /api/positions", () => {
  it("director should create a salesperson position", async () => {
    const res = await request(app)
      .post("/api/positions")
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ regionId: ctx.regionId, code: "PO-99" });

    expect(res.status).toBe(201);
    expect(res.body.position.type).toBe("salesperson");
    expect(res.body.position.currentHolder).toBeNull();
  });

  it("deputy should create position in own region", async () => {
    const res = await request(app)
      .post("/api/positions")
      .set("Authorization", `Bearer ${ctx.deputyToken}`)
      .send({ regionId: ctx.regionId, code: "PO-99" });

    expect(res.status).toBe(201);
  });

  it("should return 400 when code is missing", async () => {
    const res = await request(app)
      .post("/api/positions")
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ regionId: ctx.regionId });

    expect(res.status).toBe(400);
  });

  it("should return 400 when trying to create position in superregion", async () => {
    const res = await request(app)
      .post("/api/positions")
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ regionId: ctx.superregionId, code: "NP-99" });

    expect(res.status).toBe(400);
  });

  it("advisor should NOT create position", async () => {
    const res = await request(app)
      .post("/api/positions")
      .set("Authorization", `Bearer ${ctx.advisorToken}`)
      .send({ regionId: ctx.regionId, code: "PO-99" });

    expect(res.status).toBe(403);
  });
});

// ─── DELETE /api/positions/:id ────────────────────────────────────────────────

describe("DELETE /api/positions/:id", () => {
  let vacantPositionId: string;

  beforeEach(async () => {
    const pos = await Position.create({
      code: "PO-99",
      region: ctx.regionId,
      type: "salesperson",
      currentHolder: null,
    });
    vacantPositionId = pos._id.toString();
  });

  it("director should delete vacant position", async () => {
    const res = await request(app)
      .delete(`/api/positions/${vacantPositionId}`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(200);

    const pos = await Position.findById(vacantPositionId);
    expect(pos).toBeNull();
  });

  it("should return 400 when position is occupied", async () => {
    const res = await request(app)
      .delete(`/api/positions/${ctx.salespersonPositionId}`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(400);
  });

  it("advisor should NOT delete position", async () => {
    const res = await request(app)
      .delete(`/api/positions/${vacantPositionId}`)
      .set("Authorization", `Bearer ${ctx.advisorToken}`);

    expect(res.status).toBe(403);
  });
});

// ─── PATCH /api/positions/:id/code ────────────────────────────────────────────

describe("PATCH /api/positions/:id/code", () => {
  it("director should update position code", async () => {
    const res = await request(app)
      .patch(`/api/positions/${ctx.salespersonPositionId}/code`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ code: "PO-NEW" });

    expect(res.status).toBe(200);
    expect(res.body.position.code).toBe("PO-NEW");
  });

  it("should return 400 when code is missing", async () => {
    const res = await request(app)
      .patch(`/api/positions/${ctx.salespersonPositionId}/code`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("advisor should NOT update position code", async () => {
    const res = await request(app)
      .patch(`/api/positions/${ctx.salespersonPositionId}/code`)
      .set("Authorization", `Bearer ${ctx.advisorToken}`)
      .send({ code: "PO-NEW" });

    expect(res.status).toBe(403);
  });
});

// ─── GET /api/positions/:id/history ───────────────────────────────────────────

describe("GET /api/positions/:id/history", () => {
  beforeEach(async () => {
    await PositionHistory.create({
      positionId: ctx.salespersonPositionId,
      userId: ctx.salespersonId,
      assignedAt: new Date("2025-01-01"),
      removedAt: null,
    });
  });

  it("should return position history", async () => {
    const res = await request(app)
      .get(`/api/positions/${ctx.salespersonPositionId}/history`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.history).toHaveLength(1);
    expect(res.body.history[0].positionId).toBe(ctx.salespersonPositionId);
  });

  it("should return 401 without token", async () => {
    const res = await request(app).get(`/api/positions/${ctx.salespersonPositionId}/history`);

    expect(res.status).toBe(401);
  });
});
