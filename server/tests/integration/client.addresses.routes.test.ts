import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../src/app";
import Position from "../../src/models/Position";
import { clearDB, createTestClient, createTestContext, newAddress, TestContext } from "../helpers";

let ctx: TestContext;

beforeEach(async () => {
  await clearDB();
  ctx = await createTestContext();
});

// ─── POST /api/clients/:id/addresses ─────────────────────────────────────────

describe("POST /api/clients/:id/addresses", () => {
  it("salesperson should add address to own client", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .post(`/api/clients/${client._id}/addresses`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send(newAddress);

    expect(res.status).toBe(201);
    expect(res.body.client.addresses).toHaveLength(2);
    expect(res.body.client.addresses[1].city).toBe("Gdynia");
  });

  it("should return 400 when required fields are missing", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .post(`/api/clients/${client._id}/addresses`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ label: "Warehouse" }); // missing street, city, postalCode

    expect(res.status).toBe(400);
  });

  it("salesperson should NOT add address to another salesperson's client", async () => {
    const otherPosition = await Position.create({
      code: "PO-99",
      region: ctx.regionId,
      type: "salesperson",
      currentHolder: null,
    });
    const client = await createTestClient(ctx, { assignedTo: otherPosition._id });

    const res = await request(app)
      .post(`/api/clients/${client._id}/addresses`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send(newAddress);

    expect(res.status).toBe(403);
  });
});

// ─── PATCH /api/clients/:id/addresses/:addressId ─────────────────────────────

describe("PATCH /api/clients/:id/addresses/:addressId", () => {
  it("salesperson should update address on own client", async () => {
    const client = await createTestClient(ctx);
    const addressId = client.addresses[0]._id.toString();

    const res = await request(app)
      .patch(`/api/clients/${client._id}/addresses/${addressId}`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ city: "Sopot" });

    expect(res.status).toBe(200);
    expect(res.body.client.addresses[0].city).toBe("Sopot");
  });

  it("should return 404 for non-existent address", async () => {
    const client = await createTestClient(ctx);
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .patch(`/api/clients/${client._id}/addresses/${fakeId}`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ city: "Sopot" });

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/clients/:id/addresses/:addressId ────────────────────────────

describe("DELETE /api/clients/:id/addresses/:addressId", () => {
  it("salesperson should delete second address", async () => {
    const client = await createTestClient(ctx);

    // add second address first
    const addRes = await request(app)
      .post(`/api/clients/${client._id}/addresses`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send(newAddress);

    const secondAddressId = addRes.body.client.addresses[1]._id;

    const res = await request(app)
      .delete(`/api/clients/${client._id}/addresses/${secondAddressId}`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`);

    expect(res.status).toBe(200);
    expect(res.body.client.addresses).toHaveLength(1);
  });

  it("should return 400 when trying to delete last address", async () => {
    const client = await createTestClient(ctx);
    const addressId = client.addresses[0]._id.toString();

    const res = await request(app)
      .delete(`/api/clients/${client._id}/addresses/${addressId}`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`);

    expect(res.status).toBe(400);
  });
});

// ─── POST /api/clients/:id/addresses/:addressId/contacts ─────────────────────

describe("POST /api/clients/:id/addresses/:addressId/contacts", () => {
  it("salesperson should add contact to address", async () => {
    const client = await createTestClient(ctx);
    const addressId = client.addresses[0]._id.toString();

    const res = await request(app)
      .post(`/api/clients/${client._id}/addresses/${addressId}/contacts`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({
        firstName: "John",
        lastName: "Smith",
        phone: "+48123456789",
        email: "john@test.com",
      });

    expect(res.status).toBe(201);
    expect(res.body.client.addresses[0].contacts).toHaveLength(1);
    expect(res.body.client.addresses[0].contacts[0].firstName).toBe("John");
  });

  it("should return 400 when firstName or lastName is missing", async () => {
    const client = await createTestClient(ctx);
    const addressId = client.addresses[0]._id.toString();

    const res = await request(app)
      .post(`/api/clients/${client._id}/addresses/${addressId}/contacts`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ firstName: "John" }); // missing lastName

    expect(res.status).toBe(400);
  });

  it("should return 404 for non-existent address", async () => {
    const client = await createTestClient(ctx);
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post(`/api/clients/${client._id}/addresses/${fakeId}/contacts`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ firstName: "John", lastName: "Smith" });

    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/clients/:id/addresses/:addressId/contacts/:contactId ─────────

describe("PATCH /api/clients/:id/addresses/:addressId/contacts/:contactId", () => {
  it("salesperson should update contact", async () => {
    const client = await createTestClient(ctx);
    const addressId = client.addresses[0]._id.toString();

    const addRes = await request(app)
      .post(`/api/clients/${client._id}/addresses/${addressId}/contacts`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ firstName: "John", lastName: "Smith" });

    const contactId = addRes.body.client.addresses[0].contacts[0]._id;

    const res = await request(app)
      .patch(`/api/clients/${client._id}/addresses/${addressId}/contacts/${contactId}`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ firstName: "Jane" });

    expect(res.status).toBe(200);
    expect(res.body.client.addresses[0].contacts[0].firstName).toBe("Jane");
  });
});

// ─── DELETE /api/clients/:id/addresses/:addressId/contacts/:contactId ────────

describe("DELETE /api/clients/:id/addresses/:addressId/contacts/:contactId", () => {
  it("salesperson should delete contact", async () => {
    const client = await createTestClient(ctx);
    const addressId = client.addresses[0]._id.toString();

    const addRes = await request(app)
      .post(`/api/clients/${client._id}/addresses/${addressId}/contacts`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ firstName: "John", lastName: "Smith" });

    const contactId = addRes.body.client.addresses[0].contacts[0]._id;

    const res = await request(app)
      .delete(`/api/clients/${client._id}/addresses/${addressId}/contacts/${contactId}`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`);

    expect(res.status).toBe(200);
    expect(res.body.client.addresses[0].contacts).toHaveLength(0);
  });

  it("should return 404 for non-existent contact", async () => {
    const client = await createTestClient(ctx);
    const addressId = client.addresses[0]._id.toString();
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .delete(`/api/clients/${client._id}/addresses/${addressId}/contacts/${fakeId}`)
      .set("Authorization", `Bearer ${ctx.directorToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/clients/:id/salesperson ──────────────────────────────────────

describe("PATCH /api/clients/:id/salesperson", () => {
  it("director should change salesperson", async () => {
    const client = await createTestClient(ctx);

    const newPosition = await Position.create({
      code: "PO-99",
      region: ctx.regionId,
      type: "salesperson",
      currentHolder: null,
    });

    const res = await request(app)
      .patch(`/api/clients/${client._id}/salesperson`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({ salespersonPositionId: newPosition._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.client.assignedTo._id).toBe(newPosition._id.toString());
  });

  it("salesperson should NOT change salesperson assignment", async () => {
    const client = await createTestClient(ctx);

    const newPosition = await Position.create({
      code: "PO-99",
      region: ctx.regionId,
      type: "salesperson",
      currentHolder: null,
    });

    const res = await request(app)
      .patch(`/api/clients/${client._id}/salesperson`)
      .set("Authorization", `Bearer ${ctx.salespersonToken}`)
      .send({ salespersonPositionId: newPosition._id.toString() });

    expect(res.status).toBe(403);
  });

  it("should return 400 when salespersonPositionId is missing", async () => {
    const client = await createTestClient(ctx);

    const res = await request(app)
      .patch(`/api/clients/${client._id}/salesperson`)
      .set("Authorization", `Bearer ${ctx.directorToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});
