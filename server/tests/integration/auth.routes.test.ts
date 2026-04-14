import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { createTestContext, TestContext } from "../helpers";

let ctx: TestContext;

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    ctx = await createTestContext();
  });

  it("should return token for valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "director@seller.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.password).toBeUndefined();
  });

  it("should return 401 for invalid password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "director@seller.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("should return 401 for non-existent email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@seller.com", password: "password123" });

    expect(res.status).toBe(401);
  });

  it("should return 400 when email is missing", async () => {
    const res = await request(app).post("/api/auth/login").send({ password: "password123" });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/auth/me", () => {
  beforeEach(async () => {
    ctx = await createTestContext();
  });

  it("should return user data for valid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("director@seller.com");
    expect(res.body.user.password).toBeUndefined();
  });

  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("should return 401 with invalid token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer invalidtoken");

    expect(res.status).toBe(401);
  });
});

// ─── POST /api/auth/verify-password ──────────────────────────────────────────

describe("POST /api/auth/verify-password", () => {
  beforeEach(async () => {
    ctx = await createTestContext();
  });

  it("should return 200 for correct password", async () => {
    const res = await request(app)
      .post("/api/auth/verify-password")
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(true);
  });

  it("should return 401 for incorrect password", async () => {
    const res = await request(app)
      .post("/api/auth/verify-password")
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ password: "wrongpassword" });

    expect(res.status).toBe(401);
  });

  it("should return 400 when password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/verify-password")
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("should return 401 without token", async () => {
    const res = await request(app)
      .post("/api/auth/verify-password")
      .send({ password: "password123" });

    expect(res.status).toBe(401);
  });

  it("any role should be able to verify own password", async () => {
    for (const token of [ctx.advisorToken, ctx.salespersonToken, ctx.deputyToken]) {
      const res = await request(app)
        .post("/api/auth/verify-password")
        .set("Authorization", `Bearer ${token}`)
        .send({ password: "password123" });

      expect(res.status).toBe(200);
    }
  });
});
