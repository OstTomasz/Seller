import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import User from "../../src/models/User";
import { createTestContext, TestContext } from "../helpers";

let ctx: TestContext;

beforeEach(async () => {
  ctx = await createTestContext();
});

// ─── POST /api/users/:id/notes ────────────────────────────────────────────────

describe("POST /api/users/:id/notes", () => {
  it("director should add note to any user", async () => {
    const res = await request(app)
      .post(`/api/users/${ctx.salespersonId}/notes`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ content: "Great performance this quarter" });

    expect(res.status).toBe(200);
    expect(res.body.user.notes).toHaveLength(1);
    expect(res.body.user.notes[0].content).toBe("Great performance this quarter");
  });

  it("deputy should add note to user in own region", async () => {
    const res = await request(app)
      .post(`/api/users/${ctx.salespersonId}/notes`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`)
      .send({ content: "Deputy note" });

    expect(res.status).toBe(200);
  });

  it("advisor should NOT add note to user", async () => {
    const res = await request(app)
      .post(`/api/users/${ctx.salespersonId}/notes`)
      .set("Authorization", `Bearer ${ctx.advisorToken}`)
      .send({ content: "Advisor note" });

    expect(res.status).toBe(403);
  });

  it("salesperson should NOT add note to user", async () => {
    const res = await request(app)
      .post(`/api/users/${ctx.advisorId}/notes`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ content: "SP note" });

    expect(res.status).toBe(403);
  });

  it("should return 400 when content is missing", async () => {
    const res = await request(app)
      .post(`/api/users/${ctx.salespersonId}/notes`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

// ─── DELETE /api/users/:id/notes/:noteId ──────────────────────────────────────

describe("DELETE /api/users/:id/notes/:noteId", () => {
  let noteId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post(`/api/users/${ctx.salespersonId}/notes`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ content: "Note to delete" });

    noteId = res.body.user.notes[0]._id;
  });

  it("director should delete any note", async () => {
    const res = await request(app)
      .delete(`/api/users/${ctx.salespersonId}/notes/${noteId}`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.notes).toHaveLength(0);
  });

  it("deputy should delete own note", async () => {
    const deputyNoteRes = await request(app)
      .post(`/api/users/${ctx.salespersonId}/notes`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`)
      .send({ content: "Deputy note" });

    const deputyNoteId = deputyNoteRes.body.user.notes.find(
      (n: { content: string; _id: string }) => n.content === "Deputy note",
    )?._id;

    const res = await request(app)
      .delete(`/api/users/${ctx.salespersonId}/notes/${deputyNoteId}`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`);

    expect(res.status).toBe(200);
  });

  it("deputy should NOT delete director note", async () => {
    const res = await request(app)
      .delete(`/api/users/${ctx.salespersonId}/notes/${noteId}`)
      .set("Authorization", `Bearer ${ctx.deputyToken}`);

    expect(res.status).toBe(403);
  });

  it("advisor should NOT delete note", async () => {
    const res = await request(app)
      .delete(`/api/users/${ctx.salespersonId}/notes/${noteId}`)
      .set("Authorization", `Bearer ${ctx.advisorToken}`);

    expect(res.status).toBe(403);
  });

  it("should return 404 for non-existent note", async () => {
    const fakeId = "000000000000000000000000";
    const res = await request(app)
      .delete(`/api/users/${ctx.salespersonId}/notes/${fakeId}`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(404);
  });
});
