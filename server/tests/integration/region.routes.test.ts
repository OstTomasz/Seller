import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import User from "../../src/models/User";
import Region from "../../src/models/Region";
import mongoose from "mongoose";
import { createTestContext, TestContext } from "../helpers";

let ctx: TestContext;

beforeEach(async () => {
  ctx = await createTestContext();
});

// ─── GET /api/regions ─────────────────────────────────────────────────────────

describe("GET /api/regions", () => {
  it("should return all regions for logged in user", async () => {
    const res = await request(app)
      .get("/api/regions")
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.regions).toHaveLength(3); // superregion + regions
  });

  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/regions");
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/regions/:id ─────────────────────────────────────────────────────

describe("GET /api/regions/:id", () => {
  it("should return region by id", async () => {
    const res = await request(app)
      .get(`/api/regions/${ctx.regionId}`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.region.name).toBe("Pomerania");
  });

  it("should return 404 for non-existent region", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/regions/${fakeId}`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── POST /api/regions ────────────────────────────────────────────────────────

describe("POST /api/regions", () => {
  it("director should create a superregion", async () => {
    const res = await request(app)
      .post("/api/regions")
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ name: "Polska Południowa", prefix: "PS" });

    expect(res.status).toBe(201);
    expect(res.body.region.name).toBe("Polska Południowa");
    expect(res.body.region.parentRegion).toBeNull();
  });

  it("director should create a subregion", async () => {
    const res = await request(app)
      .post("/api/regions")
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({
        name: "Warmia",
        prefix: "WA",
        parentRegionId: ctx.superregionId,
      });

    expect(res.status).toBe(201);
    expect(res.body.region.parentRegion).toBe(ctx.superregionId);
  });

  it("deputy should create a subregion in own superregion", async () => {
    const res = await request(app)
      .post("/api/regions")
      .set("Authorization", `Bearer ${ctx.deputyToken}`)
      .send({
        name: "Warmia",
        prefix: "WA",
        parentRegionId: ctx.superregionId,
      });

    expect(res.status).toBe(201);
  });

  it("deputy should NOT create a superregion", async () => {
    const res = await request(app)
      .post("/api/regions")
      .set("Authorization", `Bearer ${ctx.deputyToken}`)
      .send({ name: "Polska Południowa", prefix: "PP" }); // no parentRegionId

    expect(res.status).toBe(403);
  });

  it("advisor should NOT create a region", async () => {
    const res = await request(app)
      .post("/api/regions")
      .set("Authorization", `Bearer ${ctx.advisorToken}`)
      .send({ name: "Nowy Region" });

    expect(res.status).toBe(403);
  });

  it("should return 400 when name is missing", async () => {
    const res = await request(app)
      .post("/api/regions")
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("should return 409 for duplicate name", async () => {
    const res = await request(app)
      .post("/api/regions")
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ name: "Pomerania", prefix: "PM" }); // already exists

    expect(res.status).toBe(409);
  });
});

// ─── PATCH /api/regions/:id/name ─────────────────────────────────────────────

describe("PATCH /api/regions/:id/name", () => {
  it("director should update region name", async () => {
    const res = await request(app)
      .patch(`/api/regions/${ctx.regionId}/name`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ name: "Nowe Pomorze" });

    expect(res.status).toBe(200);
    expect(res.body.region.name).toBe("Nowe Pomorze");
  });

  it("deputy should update name of own subregion", async () => {
    const res = await request(app)
      .patch(`/api/regions/${ctx.regionId}/name`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`)
      .send({ name: "Nowe Pomorze" });

    expect(res.status).toBe(200);
  });

  it("deputy should NOT update name of superregion", async () => {
    const res = await request(app)
      .patch(`/api/regions/${ctx.superregionId}/name`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`)
      .send({ name: "Nowa Nazwa" });

    expect(res.status).toBe(403);
  });

  it("advisor should NOT update region name", async () => {
    const res = await request(app)
      .patch(`/api/regions/${ctx.regionId}/name`)
      .set("Authorization", `Bearer ${ctx.advisorToken}`)
      .send({ name: "Nowe Pomorze" });

    expect(res.status).toBe(403);
  });
});

// ─── PATCH /api/regions/:id/deputy ───────────────────────────────────────────

describe("PATCH /api/regions/:id/deputy", () => {
  it("director should assign deputy to superregion", async () => {
    // create vacant position for new deputy
    const Position = (await import("../../src/models/Position")).default;
    const newPosition = await Position.create({
      code: "NP-2",
      region: ctx.superregionId,
      type: "deputy",
      currentHolder: null,
    });

    const newDeputy = await User.create({
      firstName: "Nowy",
      lastName: "Deputy",
      email: "newdeputy@seller.com",
      password: "password123",
      role: "deputy",
      mustChangePassword: false,
      position: newPosition._id,
    });

    await Position.findByIdAndUpdate(newPosition._id, {
      currentHolder: newDeputy._id,
    });

    const res = await request(app)
      .patch(`/api/regions/${ctx.superregionId}/deputy`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ deputyId: newDeputy._id.toString() });

    expect(res.status).toBe(200);
  });

  it("director should remove deputy from superregion", async () => {
    const res = await request(app)
      .patch(`/api/regions/${ctx.superregionId}/deputy`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ deputyId: null });

    expect(res.status).toBe(200);
    // deputy position still exists but currentHolder is null
    expect(res.body.region.deputy).not.toBeNull(); // position still assigned to region
  });

  it("deputy should NOT assign deputy", async () => {
    const res = await request(app)
      .patch(`/api/regions/${ctx.superregionId}/deputy`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`)
      .send({ deputyId: null });

    expect(res.status).toBe(403);
  });

  it("should return 400 when assigning deputy to subregion", async () => {
    const res = await request(app)
      .patch(`/api/regions/${ctx.regionId}/deputy`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ deputyId: null });

    expect(res.status).toBe(400);
  });
});

// ─── DELETE /api/regions/:id ──────────────────────────────────────────────────

describe("DELETE /api/regions/:id", () => {
  it("director should delete a subregion", async () => {
    const res = await request(app)
      .delete(`/api/regions/${ctx.regionId}`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(200);
  });

  it("deputy should delete own subregion", async () => {
    const res = await request(app)
      .delete(`/api/regions/${ctx.regionId}`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`);

    expect(res.status).toBe(200);
  });

  it("deputy should NOT delete superregion", async () => {
    const res = await request(app)
      .delete(`/api/regions/${ctx.superregionId}`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`);

    expect(res.status).toBe(403);
  });

  it("should return 400 when deleting superregion with subregions", async () => {
    const res = await request(app)
      .delete(`/api/regions/${ctx.superregionId}`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(400);
  });

  it("advisor should NOT delete region", async () => {
    const res = await request(app)
      .delete(`/api/regions/${ctx.regionId}`)
      .set("Authorization", `Bearer ${ctx.advisorToken}`);

    expect(res.status).toBe(403);
  });
});
