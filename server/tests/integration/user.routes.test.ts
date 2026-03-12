import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../src/app";
import User from "../../src/models/User";
import Region from "../../src/models/Region";
import { clearDB, createTestContext, loginAs, TestContext } from "../helpers";
import Position from "../../src/models/Position";

let ctx: TestContext;
// ─── setup ────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  await clearDB();
  ctx = await createTestContext();
});

// ─── GET /api/users ───────────────────────────────────────────────────────────

describe("GET /api/users", () => {
  it("should return all users for any logged in user", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${ctx.advisorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(4);
  });

  it("should not expose passwords", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    res.body.users.forEach((user: any) => {
      expect(user.password).toBeUndefined();
    });
  });

  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/users/:id ───────────────────────────────────────────────────────

describe("GET /api/users/:id", () => {
  it("should return user by id", async () => {
    const res = await request(app)
      .get(`/api/users/${ctx.advisorId}`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("advisor@test.com");
  });

  it("should return 404 for non-existent user", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/users/${fakeId}`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── POST /api/users ──────────────────────────────────────────────────────────

describe("POST /api/users", () => {
  it("director should create a salesperson", async () => {
    const vacantPosition = await Position.create({
      code: "PO-99",
      region: ctx.regionId,
      type: "salesperson",
      currentHolder: null,
    });

    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({
        firstName: "New",
        lastName: "Salesperson",
        email: "new@test.com",
        temporaryPassword: "temp1234",
        role: "salesperson",
        grade: 1,
        positionId: vacantPosition._id.toString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.user.mustChangePassword).toBe(true);
    expect(res.body.user.password).toBeUndefined();
  });

  it("deputy should create a salesperson in own region", async () => {
    const vacantPosition = await Position.create({
      code: "PO-99",
      region: ctx.regionId,
      type: "salesperson",
      currentHolder: null,
    });

    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${ctx.deputyToken}`)
      .send({
        firstName: "New",
        lastName: "Salesperson",
        email: "new@test.com",
        temporaryPassword: "temp1234",
        role: "salesperson",
        grade: 1,
        positionId: vacantPosition._id.toString(),
      });

    expect(res.status).toBe(201);
  });

  it("deputy should NOT create a director", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${ctx.deputyToken}`)
      .send({
        firstName: "New",
        lastName: "Director",
        email: "new@test.com",
        temporaryPassword: "temp1234",
        role: "director",
      });

    expect(res.status).toBe(403);
  });

  it("deputy should NOT create a user in another superregion region", async () => {
    const otherSuperregion = await Region.create({
      name: "South Poland",
      prefix: "SP", // ← dodaj prefix
    });
    const otherRegion = await Region.create({
      name: "Lesser Poland",
      prefix: "LP",
      parentRegion: otherSuperregion._id,
    });
    const Position = (await import("../../src/models/Position")).default;
    const otherPosition = await Position.create({
      code: "LP-2",
      region: otherRegion._id,
      type: "salesperson",
      currentHolder: null,
    });

    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${ctx.deputyToken}`)
      .send({
        firstName: "New",
        lastName: "Salesperson",
        email: "new@test.com",
        temporaryPassword: "temp1234",
        role: "salesperson",
        grade: 1,
        positionId: otherPosition._id.toString(),
      });

    expect(res.status).toBe(403);
  });

  it("advisor should NOT create a user", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${ctx.advisorToken}`)
      .send({
        firstName: "New",
        lastName: "Salesperson",
        email: "new@test.com",
        temporaryPassword: "temp1234",
        role: "salesperson",
        grade: 1,
        positionId: ctx.salespersonPositionId,
      });

    expect(res.status).toBe(403);
  });

  it("should return 409 for duplicate email", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({
        firstName: "New",
        lastName: "User",
        email: "advisor@test.com",
        temporaryPassword: "temp1234",
        role: "salesperson",
        grade: 1,
        positionId: ctx.salespersonPositionId,
      });

    expect(res.status).toBe(409);
  });

  it("should return 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ firstName: "New" });

    expect(res.status).toBe(400);
  });
});

// ─── PATCH /api/users/:id ─────────────────────────────────────────────────────

describe("PATCH /api/users/:id", () => {
  it("director should update user data", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.advisorId}`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ firstName: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body.user.firstName).toBe("Updated");
  });

  it("deputy should update user in own region", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.advisorId}`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`)
      .send({ firstName: "Updated" });

    expect(res.status).toBe(200);
  });

  it("deputy should NOT update user in another superregion region", async () => {
    const otherSuperregion = await Region.create({
      name: "South Poland",
      prefix: "SP", // ← dodaj prefix
    });
    const otherRegion = await Region.create({
      name: "Lesser Poland",
      prefix: "LP",
      parentRegion: otherSuperregion._id,
    });
    const Position = (await import("../../src/models/Position")).default;
    const otherPosition = await Position.create({
      code: "LP-2",
      region: otherRegion._id,
      type: "salesperson",
      currentHolder: null,
    });
    const otherUser = await User.create({
      firstName: "Other",
      lastName: "User",
      email: "other@test.com",
      password: "password123",
      role: "salesperson",
      grade: 1,
      position: otherPosition._id,
      mustChangePassword: false,
    });

    const res = await request(app)
      .patch(`/api/users/${otherUser._id}`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`)
      .send({ firstName: "Updated" });

    expect(res.status).toBe(403);
  });

  it("advisor should NOT update another user", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.salespersonId}`)
      .set("Authorization", `Bearer ${ctx.advisorToken}`)
      .send({ firstName: "Updated" });

    expect(res.status).toBe(403);
  });
});

// ─── PATCH /api/users/:id/role ────────────────────────────────────────────────

describe("PATCH /api/users/:id/role", () => {
  it("director should update user role and grade", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.advisorId}/role`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ role: "salesperson", grade: 2 });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("salesperson");
    expect(res.body.user.grade).toBe(2);
  });

  it("deputy should NOT update user role", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.advisorId}/role`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`)
      .send({ role: "salesperson", grade: 2 });

    expect(res.status).toBe(403);
  });

  it("should return 400 when role is missing", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.advisorId}/role`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ grade: 2 });

    expect(res.status).toBe(400);
  });

  it("should return 400 when grade is missing for salesperson", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.advisorId}/role`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ role: "salesperson" });

    expect(res.status).toBe(400);
  });
});

// ─── PATCH /api/users/:id/toggle-active ──────────────────────────────────────

describe("PATCH /api/users/:id/toggle-active", () => {
  it("director should deactivate a user", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.advisorId}/toggle-active`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.isActive).toBe(false);
  });

  it("director should reactivate a user", async () => {
    await User.findByIdAndUpdate(ctx.advisorId, { isActive: false });

    const res = await request(app)
      .patch(`/api/users/${ctx.advisorId}/toggle-active`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.isActive).toBe(true);
  });

  it("should NOT deactivate yourself", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.directorId}/toggle-active`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(400);
  });

  it("deputy should deactivate user in own region", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.advisorId}/toggle-active`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`);

    expect(res.status).toBe(200);
  });

  it("advisor should NOT deactivate a user", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.salespersonId}/toggle-active`)
      .set("Authorization", `Bearer ${ctx.advisorToken}`);

    expect(res.status).toBe(403);
  });
});

// ─── PATCH /api/users/me/password ────────────────────────────────────────────

describe("PATCH /api/users/me/password", () => {
  it("should change own password", async () => {
    const res = await request(app)
      .patch("/api/users/me/password")
      .set("Authorization", `Bearer ${ctx.advisorToken}`)
      .send({ currentPassword: "password123", newPassword: "newpassword123" });

    expect(res.status).toBe(200);
  });

  it("should return 400 for incorrect current password", async () => {
    const res = await request(app)
      .patch("/api/users/me/password")
      .set("Authorization", `Bearer ${ctx.advisorToken}`)
      .send({
        currentPassword: "wrongpassword",
        newPassword: "newpassword123",
      });

    expect(res.status).toBe(400);
  });

  it("should return 400 when new password is too short", async () => {
    const res = await request(app)
      .patch("/api/users/me/password")
      .set("Authorization", `Bearer ${ctx.advisorToken}`)
      .send({ currentPassword: "password123", newPassword: "short" });

    expect(res.status).toBe(400);
  });
});

// ─── PATCH /api/users/:id/reset-password ─────────────────────────────────────

describe("PATCH /api/users/:id/reset-password", () => {
  it("director should reset user password", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.advisorId}/reset-password`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ temporaryPassword: "temp1234" });

    expect(res.status).toBe(200);

    // verify mustChangePassword is set back to true
    const user = await User.findById(ctx.advisorId);
    expect(user?.mustChangePassword).toBe(true);
  });

  it("deputy should reset password of user in own region", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.advisorId}/reset-password`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`)
      .send({ temporaryPassword: "temp1234" });

    expect(res.status).toBe(200);
  });

  it("advisor should NOT reset another user password", async () => {
    const res = await request(app)
      .patch(`/api/users/${ctx.salespersonId}/reset-password`)
      .set("Authorization", `Bearer ${ctx.advisorToken}`)
      .send({ temporaryPassword: "temp1234" });

    expect(res.status).toBe(403);
  });
});

// ─── mustChangePassword middleware ────────────────────────────────────────────

describe("mustChangePassword middleware", () => {
  it("should block access when mustChangePassword is true", async () => {
    const Position = (await import("../../src/models/Position")).default;
    const newPosition = await Position.create({
      code: "PO-99",
      region: ctx.regionId,
      type: "salesperson",
      currentHolder: null,
    });

    await User.create({
      firstName: "New",
      lastName: "User",
      email: "newuser@test.com",
      password: "temp1234",
      role: "salesperson",
      grade: 1,
      position: newPosition._id,
      mustChangePassword: true,
    });

    const newUserToken = await loginAs("newuser@test.com", "temp1234");

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${newUserToken}`);

    expect(res.status).toBe(403);
    expect(res.body.mustChangePassword).toBe(true);
  });

  it("should allow password change when mustChangePassword is true", async () => {
    const Position = (await import("../../src/models/Position")).default;
    const newPosition = await Position.create({
      code: "PO-99",
      region: ctx.regionId,
      type: "salesperson",
      currentHolder: null,
    });

    await User.create({
      firstName: "New",
      lastName: "User",
      email: "newuser@test.com",
      password: "temp1234",
      role: "salesperson",
      grade: 1,
      position: newPosition._id,
      mustChangePassword: true,
    });

    const newUserToken = await loginAs("newuser@test.com", "temp1234");

    const res = await request(app)
      .patch("/api/users/me/password")
      .set("Authorization", `Bearer ${newUserToken}`)
      .send({ currentPassword: "temp1234", newPassword: "newpassword123" });

    expect(res.status).toBe(200);
  });
});
