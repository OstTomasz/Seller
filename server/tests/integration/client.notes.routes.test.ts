import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../src/app";

import Position from "../../src/models/Position";
import { clearDB, createTestClient, createTestContext, TestContext } from "../helpers";

let ctx: TestContext;

beforeEach(async () => {
  await clearDB();
  ctx = await createTestContext();
});

// ─── POST /api/clients/:id/notes ─────────────────────────────────────────────

describe("POST /api/clients/:id/notes", () => {
  it("salesperson should add a note to own client", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .post(`/api/clients/${client._id}/notes`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ content: "First meeting went well" });

    expect(res.status).toBe(201);
    expect(res.body.client.notes).toHaveLength(1);
    expect(res.body.client.notes[0].content).toBe("First meeting went well");
  });

  it("advisor should add a note to client in own region", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .post(`/api/clients/${client._id}/notes`)
      .set("Authorization", `Bearer ${ctx.advisorToken}`)
      .send({ content: "Advisor note" });

    expect(res.status).toBe(201);
    expect(res.body.client.notes).toHaveLength(1);
  });

  it("director should add a note to any client", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .post(`/api/clients/${client._id}/notes`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ content: "Director note" });

    expect(res.status).toBe(201);
  });

  it("salesperson should NOT add note to another salesperson's client", async () => {
    const otherPosition = await Position.create({
      code: "PO-99",
      region: ctx.regionId,
      type: "salesperson",
      currentHolder: null,
    });
    const client = await createTestClient(ctx, { assignedTo: otherPosition._id });

    const res = await request(app)
      .post(`/api/clients/${client._id}/notes`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ content: "Unauthorized note" });

    expect(res.status).toBe(403);
  });

  it("should return 400 when content is missing", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .post(`/api/clients/${client._id}/notes`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("should return 404 for non-existent client", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post(`/api/clients/${fakeId}/notes`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ content: "Note" });

    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/clients/:id/notes/:noteId ────────────────────────────────────

describe("PATCH /api/clients/:id/notes/:noteId", () => {
  it("note author should update own note", async () => {
    const client = await createTestClient(ctx);

    const addRes = await request(app)
      .post(`/api/clients/${client._id}/notes`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ content: "Original note" });

    const noteId = addRes.body.client.notes[0]._id;

    const res = await request(app)
      .patch(`/api/clients/${client._id}/notes/${noteId}`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ content: "Updated note" });

    expect(res.status).toBe(200);
    expect(res.body.client.notes[0].content).toBe("Updated note");
  });

  it("director should update any note", async () => {
    const client = await createTestClient(ctx);

    const addRes = await request(app)
      .post(`/api/clients/${client._id}/notes`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ content: "Original note" });

    const noteId = addRes.body.client.notes[0]._id;

    const res = await request(app)
      .patch(`/api/clients/${client._id}/notes/${noteId}`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ content: "Director updated note" });

    expect(res.status).toBe(200);
  });

  it("advisor should NOT update salesperson's note", async () => {
    const client = await createTestClient(ctx);

    const addRes = await request(app)
      .post(`/api/clients/${client._id}/notes`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ content: "Salesperson note" });

    const noteId = addRes.body.client.notes[0]._id;

    const res = await request(app)
      .patch(`/api/clients/${client._id}/notes/${noteId}`)
      .set("Authorization", `Bearer ${ctx.advisorToken}`)
      .send({ content: "Advisor trying to update" });

    expect(res.status).toBe(403);
  });

  it("should return 404 for non-existent note", async () => {
    const client = await createTestClient(ctx);
    const fakeNoteId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .patch(`/api/clients/${client._id}/notes/${fakeNoteId}`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ content: "Updated" });

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/clients/:id/notes/:noteId ───────────────────────────────────

describe("DELETE /api/clients/:id/notes/:noteId", () => {
  it("note author should delete own note", async () => {
    const client = await createTestClient(ctx);

    const addRes = await request(app)
      .post(`/api/clients/${client._id}/notes`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ content: "Note to delete" });

    const noteId = addRes.body.client.notes[0]._id;

    const res = await request(app)
      .delete(`/api/clients/${client._id}/notes/${noteId}`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`);

    expect(res.status).toBe(200);
    expect(res.body.client.notes).toHaveLength(0);
  });

  it("director should delete any note", async () => {
    const client = await createTestClient(ctx);

    const addRes = await request(app)
      .post(`/api/clients/${client._id}/notes`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ content: "Note to delete" });

    const noteId = addRes.body.client.notes[0]._id;

    const res = await request(app)
      .delete(`/api/clients/${client._id}/notes/${noteId}`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.client.notes).toHaveLength(0);
  });

  it("advisor should NOT delete salesperson's note", async () => {
    const client = await createTestClient(ctx);

    const addRes = await request(app)
      .post(`/api/clients/${client._id}/notes`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ content: "Salesperson note" });

    const noteId = addRes.body.client.notes[0]._id;

    const res = await request(app)
      .delete(`/api/clients/${client._id}/notes/${noteId}`)
      .set("Authorization", `Bearer ${ctx.advisorToken}`);

    expect(res.status).toBe(403);
  });

  it("should return 404 for non-existent note", async () => {
    const client = await createTestClient(ctx);
    const fakeNoteId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .delete(`/api/clients/${client._id}/notes/${fakeNoteId}`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(404);
  });
});
