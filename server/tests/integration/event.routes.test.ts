// server/tests/integration/event.routes.test.ts

import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { clearDB, createTestContext, createTestEvent, TestContext } from "../helpers";
import EventModel from "../../src/models/Event";
import Invitation from "../../src/models/Invitation";
import Notification from "../../src/models/Notification";

let ctx: TestContext;

beforeEach(async () => {
  await clearDB();
  ctx = await createTestContext();
});

// ─── GET /api/events ──────────────────────────────────────────────────────────

describe("GET /api/events", () => {
  it("should return own events", async () => {
    await createTestEvent(ctx.salespersonId);

    const res = await request(app)
      .get("/api/events")
      .set("Authorization", `Bearer ${ctx.salespersonToken}`);

    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(1);
  });

  it("should return accepted invitation events", async () => {
    const event = await createTestEvent(ctx.directorId);
    await Invitation.create({
      eventId: event._id,
      inviteeId: ctx.salespersonId,
      status: "accepted",
    });

    const res = await request(app)
      .get("/api/events")
      .set("Authorization", `Bearer ${ctx.salespersonToken}`);

    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(1);
  });

  it("should NOT return rejected invitation events", async () => {
    const event = await createTestEvent(ctx.directorId);
    await Invitation.create({
      eventId: event._id,
      inviteeId: ctx.salespersonId,
      status: "rejected",
    });

    const res = await request(app)
      .get("/api/events")
      .set("Authorization", `Bearer ${ctx.salespersonToken}`);

    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(0);
  });

  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/events");
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/events/invitations ─────────────────────────────────────────────

describe("GET /api/events/invitations", () => {
  it("should return pending invitations", async () => {
    const event = await createTestEvent(ctx.directorId);
    await Invitation.create({
      eventId: event._id,
      inviteeId: ctx.salespersonId,
      status: "pending",
    });

    const res = await request(app)
      .get("/api/events/invitations")
      .set("Authorization", `Bearer ${ctx.salespersonToken}`);

    expect(res.status).toBe(200);
    expect(res.body.invitations).toHaveLength(1);
  });

  it("should NOT return accepted invitations", async () => {
    const event = await createTestEvent(ctx.directorId);
    await Invitation.create({
      eventId: event._id,
      inviteeId: ctx.salespersonId,
      status: "accepted",
    });

    const res = await request(app)
      .get("/api/events/invitations")
      .set("Authorization", `Bearer ${ctx.salespersonToken}`);

    expect(res.status).toBe(200);
    expect(res.body.invitations).toHaveLength(0);
  });
});

// ─── POST /api/events ─────────────────────────────────────────────────────────

describe("POST /api/events", () => {
  it("salesperson should create a personal event", async () => {
    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({
        title: "Deadline prep",
        startDate: "2026-06-15T10:00:00Z",
        duration: 30,
        allDay: false,
        type: "personal",
      });

    expect(res.status).toBe(201);
    expect(res.body.event.title).toBe("Deadline prep");
    expect(res.body.conflicts).toHaveLength(0);
  });

  it("should create all-day event without duration", async () => {
    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({
        title: "Conference",
        startDate: "2026-06-15T00:00:00Z",
        allDay: true,
        type: "personal",
      });

    expect(res.status).toBe(201);
    expect(res.body.event.allDay).toBe(true);
    expect(res.body.event.duration).toBeNull();
  });

  it("should return 400 when duration missing for non all-day event", async () => {
    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({
        title: "Meeting",
        startDate: "2026-06-15T10:00:00Z",
        allDay: false,
        type: "personal",
      });

    expect(res.status).toBe(400);
  });

  it("should return 400 when title is missing", async () => {
    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({
        startDate: "2026-06-15T10:00:00Z",
        duration: 60,
        allDay: false,
        type: "personal",
      });

    expect(res.status).toBe(400);
  });

  it("should detect conflict with existing event", async () => {
    await createTestEvent(ctx.salespersonId, {
      startDate: new Date("2026-06-15T10:00:00Z"),
      duration: 60,
    });

    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({
        title: "Overlapping meeting",
        startDate: "2026-06-15T10:30:00Z",
        duration: 60,
        allDay: false,
        type: "personal",
      });

    expect(res.status).toBe(201);
    expect(res.body.conflicts).toHaveLength(1);
    expect(res.body.conflicts[0].title).toBe("Test Meeting");
  });

  it("should send invitations and notifications to invitees", async () => {
    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({
        title: "Team review",
        startDate: "2026-06-15T10:00:00Z",
        duration: 60,
        allDay: false,
        type: "team_meeting",
        inviteeIds: [ctx.salespersonId],
      });

    expect(res.status).toBe(201);

    const invitation = await Invitation.findOne({ inviteeId: ctx.salespersonId });
    expect(invitation).not.toBeNull();
    expect(invitation?.status).toBe("pending");

    const notification = await Notification.findOne({
      userId: ctx.salespersonId,
      type: "event_invitation",
    });
    expect(notification).not.toBeNull();
  });

  it("mandatory event should auto-accept invitations", async () => {
    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({
        title: "Mandatory standup",
        startDate: "2026-06-15T09:00:00Z",
        duration: 30,
        allDay: false,
        type: "team_meeting",
        mandatory: true,
        inviteeIds: [ctx.salespersonId, ctx.advisorId],
      });

    expect(res.status).toBe(201);

    const invitations = await Invitation.find({ status: "accepted" });
    expect(invitations).toHaveLength(2);

    const notification = await Notification.findOne({
      userId: ctx.salespersonId,
      type: "event_mandatory",
    });
    expect(notification).not.toBeNull();
  });

  it("salesperson should NOT create mandatory event", async () => {
    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({
        title: "Mandatory?",
        startDate: "2026-06-15T10:00:00Z",
        duration: 30,
        allDay: false,
        type: "team_meeting",
        mandatory: true,
        inviteeIds: [ctx.advisorId],
      });

    expect(res.status).toBe(403);
  });

  it("mandatory event with conflict should send event_conflict notification", async () => {
    await createTestEvent(ctx.salespersonId, {
      startDate: new Date("2026-06-15T09:00:00Z"),
      duration: 60,
    });

    await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({
        title: "Mandatory overlap",
        startDate: "2026-06-15T09:30:00Z",
        duration: 30,
        allDay: false,
        type: "team_meeting",
        mandatory: true,
        inviteeIds: [ctx.salespersonId],
      });

    const conflict = await Notification.findOne({
      userId: ctx.salespersonId,
      type: "event_conflict",
    });
    expect(conflict).not.toBeNull();
  });
});

// ─── PATCH /api/events/:id ────────────────────────────────────────────────────

describe("PATCH /api/events/:id", () => {
  it("owner should update own event", async () => {
    const event = await createTestEvent(ctx.salespersonId);

    const res = await request(app)
      .patch(`/api/events/${event._id}`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ title: "Updated title" });

    expect(res.status).toBe(200);
    expect(res.body.event.title).toBe("Updated title");
  });

  it("should NOT update another user's event", async () => {
    const event = await createTestEvent(ctx.directorId);

    const res = await request(app)
      .patch(`/api/events/${event._id}`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ title: "Hijacked" });

    expect(res.status).toBe(403);
  });

  it("should detect conflict on update", async () => {
    await createTestEvent(ctx.salespersonId, {
      startDate: new Date("2026-06-15T11:00:00Z"),
      duration: 60,
    });
    const event = await createTestEvent(ctx.salespersonId, {
      startDate: new Date("2026-06-15T09:00:00Z"),
      duration: 30,
    });

    const res = await request(app)
      .patch(`/api/events/${event._id}`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ startDate: "2026-06-15T11:00:00Z", duration: 60 });

    expect(res.status).toBe(200);
    expect(res.body.conflicts).toHaveLength(1);
  });
});

// ─── DELETE /api/events/:id ───────────────────────────────────────────────────

describe("DELETE /api/events/:id", () => {
  it("owner should delete own event", async () => {
    const event = await createTestEvent(ctx.salespersonId);

    const res = await request(app)
      .delete(`/api/events/${event._id}`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`);

    expect(res.status).toBe(200);
    expect(await EventModel.findById(event._id)).toBeNull();
  });

  it("should delete associated invitations on event delete", async () => {
    const event = await createTestEvent(ctx.directorId);
    await Invitation.create({
      eventId: event._id,
      inviteeId: ctx.salespersonId,
      status: "pending",
    });

    await request(app)
      .delete(`/api/events/${event._id}`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    const invitations = await Invitation.find({ eventId: event._id });
    expect(invitations).toHaveLength(0);
  });

  it("should NOT delete another user's event", async () => {
    const event = await createTestEvent(ctx.directorId);

    const res = await request(app)
      .delete(`/api/events/${event._id}`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`);

    expect(res.status).toBe(403);
  });
});

// ─── PATCH /api/events/:id/respond ───────────────────────────────────────────

describe("PATCH /api/events/:id/respond", () => {
  it("invitee should accept invitation", async () => {
    const event = await createTestEvent(ctx.directorId);
    await Invitation.create({
      eventId: event._id,
      inviteeId: ctx.salespersonId,
      status: "pending",
    });

    const res = await request(app)
      .patch(`/api/events/${event._id}/respond`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ status: "accepted" });

    expect(res.status).toBe(200);
    expect(res.body.invitation.status).toBe("accepted");

    const notification = await Notification.findOne({
      userId: ctx.directorId,
      type: "event_response",
    });
    expect(notification).not.toBeNull();
  });

  it("invitee should reject invitation", async () => {
    const event = await createTestEvent(ctx.directorId);
    await Invitation.create({
      eventId: event._id,
      inviteeId: ctx.salespersonId,
      status: "pending",
    });

    const res = await request(app)
      .patch(`/api/events/${event._id}/respond`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ status: "rejected" });

    expect(res.status).toBe(200);
    expect(res.body.invitation.status).toBe("rejected");
  });

  it("should NOT respond to mandatory event", async () => {
    const event = await createTestEvent(ctx.directorId, { mandatory: true });
    await Invitation.create({
      eventId: event._id,
      inviteeId: ctx.salespersonId,
      status: "accepted",
    });

    const res = await request(app)
      .patch(`/api/events/${event._id}/respond`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ status: "rejected" });

    expect(res.status).toBe(403);
  });

  it("should return 400 when already responded", async () => {
    const event = await createTestEvent(ctx.directorId);
    await Invitation.create({
      eventId: event._id,
      inviteeId: ctx.salespersonId,
      status: "accepted",
    });

    const res = await request(app)
      .patch(`/api/events/${event._id}/respond`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ status: "rejected" });

    expect(res.status).toBe(400);
  });

  it("should return 400 with invalid status", async () => {
    const event = await createTestEvent(ctx.directorId);
    await Invitation.create({
      eventId: event._id,
      inviteeId: ctx.salespersonId,
      status: "pending",
    });

    const res = await request(app)
      .patch(`/api/events/${event._id}/respond`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ status: "maybe" });

    expect(res.status).toBe(400);
  });

  it("non-invitee should NOT respond to event", async () => {
    const event = await createTestEvent(ctx.directorId);

    const res = await request(app)
      .patch(`/api/events/${event._id}/respond`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ status: "accepted" });

    expect(res.status).toBe(404);
  });
});

// ─── GET /api/events/users ────────────────────────────────────────────────────

describe("GET /api/events/users", () => {
  it("should return all users for invite", async () => {
    const res = await request(app)
      .get("/api/events/users")
      .set("Authorization", `Bearer ${ctx.salespersonToken}`);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(0);
  });

  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/events/users");
    expect(res.status).toBe(401);
  });
});
