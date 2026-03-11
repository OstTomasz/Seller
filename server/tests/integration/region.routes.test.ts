import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import User from "../../src/models/User";
import Region from "../../src/models/Region";
import mongoose from "mongoose";
import { clearDB, loginAs } from "../helpers";

// shared vals
let directorToken: string;
let deputyToken: string;
let advisorToken: string;
let superregionId: string;
let regionId: string;

beforeEach(async () => {
  await clearDB();

  // create superregion
  const superregion = await Region.create({ name: "Polska Północna" });
  superregionId = superregion._id.toString();

  // create deputy and region assign
  const deputy = await User.create({
    firstName: "Anna",
    lastName: "Deputy",
    email: "deputy@test.com",
    password: "password123",
    role: "deputy",
  });

  await Region.findByIdAndUpdate(superregionId, { deputy: deputy._id });

  // subregion
  const region = await Region.create({
    name: "Pomorze",
    parentRegion: superregionId,
  });
  regionId = region._id.toString();

  // other users
  await User.create({
    firstName: "Jan",
    lastName: "Dyrektor",
    email: "director@test.com",
    password: "password123",
    role: "director",
  });

  await User.create({
    firstName: "Piotr",
    lastName: "Advisor",
    email: "advisor@test.com",
    password: "password123",
    role: "advisor",
    grade: 1,
    region: regionId,
  });

  // get tokens
  directorToken = await loginAs("director@test.com");
  deputyToken = await loginAs("deputy@test.com");
  advisorToken = await loginAs("advisor@test.com");
});

// ─── GET /api/regions ─────────────────────────────────────────────────────────

describe("GET /api/regions", () => {
  it("should return all regions for logged in user", async () => {
    const res = await request(app)
      .get("/api/regions")
      .set("Authorization", `Bearer ${directorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.regions).toHaveLength(2); // superregion + region
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
      .get(`/api/regions/${regionId}`)
      .set("Authorization", `Bearer ${directorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.region.name).toBe("Pomorze");
  });

  it("should return 404 for non-existent region", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/regions/${fakeId}`)
      .set("Authorization", `Bearer ${directorToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── POST /api/regions ────────────────────────────────────────────────────────

describe("POST /api/regions", () => {
  it("director should create a superregion", async () => {
    const res = await request(app)
      .post("/api/regions")
      .set("Authorization", `Bearer ${directorToken}`)
      .send({ name: "Polska Południowa" });

    expect(res.status).toBe(201);
    expect(res.body.region.name).toBe("Polska Południowa");
    expect(res.body.region.parentRegion).toBeNull();
  });

  it("director should create a subregion", async () => {
    const res = await request(app)
      .post("/api/regions")
      .set("Authorization", `Bearer ${directorToken}`)
      .send({ name: "Warmia", parentRegionId: superregionId });

    expect(res.status).toBe(201);
    expect(res.body.region.parentRegion).toBe(superregionId);
  });

  it("deputy should create a subregion in own superregion", async () => {
    const res = await request(app)
      .post("/api/regions")
      .set("Authorization", `Bearer ${deputyToken}`)
      .send({ name: "Warmia", parentRegionId: superregionId });

    expect(res.status).toBe(201);
  });

  it("deputy should NOT create a superregion", async () => {
    const res = await request(app)
      .post("/api/regions")
      .set("Authorization", `Bearer ${deputyToken}`)
      .send({ name: "Polska Południowa" }); // no parentRegionId

    expect(res.status).toBe(403);
  });

  it("advisor should NOT create a region", async () => {
    const res = await request(app)
      .post("/api/regions")
      .set("Authorization", `Bearer ${advisorToken}`)
      .send({ name: "Nowy Region" });

    expect(res.status).toBe(403);
  });

  it("should return 400 when name is missing", async () => {
    const res = await request(app)
      .post("/api/regions")
      .set("Authorization", `Bearer ${directorToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("should return 409 for duplicate name", async () => {
    const res = await request(app)
      .post("/api/regions")
      .set("Authorization", `Bearer ${directorToken}`)
      .send({ name: "Pomorze" }); // already exists

    expect(res.status).toBe(409);
  });
});

// ─── PATCH /api/regions/:id/name ─────────────────────────────────────────────

describe("PATCH /api/regions/:id/name", () => {
  it("director should update region name", async () => {
    const res = await request(app)
      .patch(`/api/regions/${regionId}/name`)
      .set("Authorization", `Bearer ${directorToken}`)
      .send({ name: "Nowe Pomorze" });

    expect(res.status).toBe(200);
    expect(res.body.region.name).toBe("Nowe Pomorze");
  });

  it("deputy should update name of own subregion", async () => {
    const res = await request(app)
      .patch(`/api/regions/${regionId}/name`)
      .set("Authorization", `Bearer ${deputyToken}`)
      .send({ name: "Nowe Pomorze" });

    expect(res.status).toBe(200);
  });

  it("deputy should NOT update name of superregion", async () => {
    const res = await request(app)
      .patch(`/api/regions/${superregionId}/name`)
      .set("Authorization", `Bearer ${deputyToken}`)
      .send({ name: "Nowa Nazwa" });

    expect(res.status).toBe(403);
  });

  it("advisor should NOT update region name", async () => {
    const res = await request(app)
      .patch(`/api/regions/${regionId}/name`)
      .set("Authorization", `Bearer ${advisorToken}`)
      .send({ name: "Nowe Pomorze" });

    expect(res.status).toBe(403);
  });
});

// ─── PATCH /api/regions/:id/deputy ───────────────────────────────────────────

describe("PATCH /api/regions/:id/deputy", () => {
  it("director should assign deputy to superregion", async () => {
    const newDeputy = await User.create({
      firstName: "Nowy",
      lastName: "Deputy",
      email: "newdeputy@test.com",
      password: "password123",
      role: "deputy",
    });

    const res = await request(app)
      .patch(`/api/regions/${superregionId}/deputy`)
      .set("Authorization", `Bearer ${directorToken}`)
      .send({ deputyId: newDeputy._id.toString() });

    expect(res.status).toBe(200);
  });

  it("director should remove deputy from superregion", async () => {
    const res = await request(app)
      .patch(`/api/regions/${superregionId}/deputy`)
      .set("Authorization", `Bearer ${directorToken}`)
      .send({ deputyId: null });

    expect(res.status).toBe(200);
    expect(res.body.region.deputy).toBeNull();
  });

  it("deputy should NOT assign deputy", async () => {
    const res = await request(app)
      .patch(`/api/regions/${superregionId}/deputy`)
      .set("Authorization", `Bearer ${deputyToken}`)
      .send({ deputyId: null });

    expect(res.status).toBe(403);
  });

  it("should return 400 when assigning deputy to subregion", async () => {
    const res = await request(app)
      .patch(`/api/regions/${regionId}/deputy`)
      .set("Authorization", `Bearer ${directorToken}`)
      .send({ deputyId: null });

    expect(res.status).toBe(400);
  });
});

// ─── DELETE /api/regions/:id ──────────────────────────────────────────────────

describe("DELETE /api/regions/:id", () => {
  it("director should delete a subregion", async () => {
    const res = await request(app)
      .delete(`/api/regions/${regionId}`)
      .set("Authorization", `Bearer ${directorToken}`);

    expect(res.status).toBe(200);
  });

  it("deputy should delete own subregion", async () => {
    const res = await request(app)
      .delete(`/api/regions/${regionId}`)
      .set("Authorization", `Bearer ${deputyToken}`);

    expect(res.status).toBe(200);
  });

  it("deputy should NOT delete superregion", async () => {
    const res = await request(app)
      .delete(`/api/regions/${superregionId}`)
      .set("Authorization", `Bearer ${deputyToken}`);

    expect(res.status).toBe(403);
  });

  it("should return 400 when deleting superregion with subregions", async () => {
    const res = await request(app)
      .delete(`/api/regions/${superregionId}`)
      .set("Authorization", `Bearer ${directorToken}`);

    expect(res.status).toBe(400);
  });

  it("advisor should NOT delete region", async () => {
    const res = await request(app)
      .delete(`/api/regions/${regionId}`)
      .set("Authorization", `Bearer ${advisorToken}`);

    expect(res.status).toBe(403);
  });
});
