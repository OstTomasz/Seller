import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import User from "../../src/models/User";
import { clearDB } from "../helpers";

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await clearDB();
    await User.create({
      firstName: "Jan",
      lastName: "Kowalski",
      email: "director@test.com",
      password: "password123",
      role: "director",
    });
  });

  it("should return token for valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "director@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.password).toBeUndefined();
  });

  it("should return 401 for invalid password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "director@test.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("should return 401 for non-existent email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.com", password: "password123" });

    expect(res.status).toBe(401);
  });

  it("should return 400 when email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: "password123" });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/auth/me", () => {
  let token: string;

  beforeEach(async () => {
    await clearDB();
    await User.create({
      firstName: "Jan",
      lastName: "Kowalski",
      email: "director@test.com",
      password: "password123",
      role: "director",
    });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "director@test.com", password: "password123" });

    token = loginRes.body.token;
  });

  it("should return user data for valid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("director@test.com");
    expect(res.body.user.password).toBeUndefined();
  });

  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("should return 401 with invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalidtoken");

    expect(res.status).toBe(401);
  });
});
