import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import Client from "../../src/models/Client";
import Position from "../../src/models/Position";
import Region from "../../src/models/Region";
import * as clientService from "../../src/services/client.service";
import { ForbiddenError, NotFoundError } from "../../src/utils/errors";
import { clearDB, createTestClient, createTestDB, sampleAddress, TestDB } from "../helpers";

let db: TestDB;

beforeEach(async () => {
  await clearDB();
  db = await createTestDB();
});

// ─── getClients ───────────────────────────────────────────────────────────────

describe("getClients", () => {
  it("director should see all clients", async () => {
    await createTestClient(db);
    await createTestClient(db, { companyName: "Another Company" });

    const clients = await clientService.getClients(db.directorId, "director");
    expect(clients).toHaveLength(2);
  });

  it("salesperson should see only own clients", async () => {
    await createTestClient(db);
    const otherPosition = await Position.create({
      code: "PO-99",
      region: db.regionId,
      type: "salesperson",
      currentHolder: null,
    });
    await createTestClient(db, {
      companyName: "Other Company",
      assignedTo: otherPosition._id,
    });

    const clients = await clientService.getClients(db.salespersonId, "salesperson");
    expect(clients).toHaveLength(1);
    expect(clients[0].companyName).toBe("Test Company");
  });

  it("advisor should see clients in own region", async () => {
    await createTestClient(db);

    const clients = await clientService.getClients(db.advisorId, "advisor");
    expect(clients).toHaveLength(1);
  });

  it("deputy should see clients in own superregion", async () => {
    await createTestClient(db);

    const clients = await clientService.getClients(db.deputyId, "deputy");
    expect(clients).toHaveLength(1);
  });

  it("deputy should NOT see clients outside own superregion", async () => {
    const otherSuperregion = await Region.create({
      name: "South Poland",
      prefix: "SP",
    });
    const otherRegion = await Region.create({
      name: "Lesser Poland",
      prefix: "LP",
      parentRegion: otherSuperregion._id,
    });
    const otherPosition = await Position.create({
      code: "LP-2",
      region: otherRegion._id,
      type: "salesperson",
      currentHolder: null,
    });
    await createTestClient(db, { assignedTo: otherPosition._id });

    const clients = await clientService.getClients(db.deputyId, "deputy");
    expect(clients).toHaveLength(0);
  });
});

// ─── getClientById ────────────────────────────────────────────────────────────

describe("getClientById", () => {
  it("director should get any client", async () => {
    const client = await createTestClient(db);

    const found = await clientService.getClientById(
      client._id.toString(),
      db.directorId,
      "director",
    );
    expect(found.companyName).toBe("Test Company");
  });

  it("salesperson should get own client", async () => {
    const client = await createTestClient(db);

    const found = await clientService.getClientById(
      client._id.toString(),
      db.salespersonId,
      "salesperson",
    );
    expect(found.companyName).toBe("Test Company");
  });

  it("salesperson should NOT get another salesperson's client", async () => {
    const otherPosition = await Position.create({
      code: "PO-99",
      region: db.regionId,
      type: "salesperson",
      currentHolder: null,
    });
    const client = await createTestClient(db, { assignedTo: otherPosition._id });

    await expect(
      clientService.getClientById(client._id.toString(), db.salespersonId, "salesperson"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw NotFoundError for non-existent client", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    await expect(clientService.getClientById(fakeId, db.directorId, "director")).rejects.toThrow(
      NotFoundError,
    );
  });
});

// ─── createTestClient ─────────────────────────────────────────────────────────────

describe("createTestClient", () => {
  it("salesperson should create client with auto-assigned advisor", async () => {
    try {
      const client = await clientService.createClient(
        { companyName: "New Company", addresses: [sampleAddress] },
        db.salespersonId,
        "salesperson",
      );

      expect(client.companyName).toBe("New Company");
      expect(client.assignedTo._id.toString()).toBe(db.salespersonPositionId);
      expect(client.assignedAdvisor?._id.toString()).toBe(db.advisorPositionId);
    } catch (error: any) {
      throw error;
    }
  });

  it("advisor should create client assigned to salesperson", async () => {
    const client = await clientService.createClient(
      {
        companyName: "New Company",
        addresses: [sampleAddress],
        salespersonPositionId: db.salespersonPositionId,
      },
      db.advisorId,
      "advisor",
    );

    expect(client.assignedTo._id.toString()).toBe(db.salespersonPositionId);
    expect(client.assignedAdvisor?._id.toString()).toBe(db.advisorPositionId);
  });

  it("advisor should NOT create client for salesperson outside own region", async () => {
    const otherRegion = await Region.create({
      name: "Silesia2",
      prefix: "S2",
      parentRegion: db.superregionId,
    });
    const otherPosition = await Position.create({
      code: "S2-2",
      region: otherRegion._id,
      type: "salesperson",
      currentHolder: null,
    });

    await expect(
      clientService.createClient(
        {
          companyName: "New Company",
          addresses: [sampleAddress],
          salespersonPositionId: otherPosition._id.toString(),
        },
        db.advisorId,
        "advisor",
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it("director should create client assigned to salesperson", async () => {
    const client = await clientService.createClient(
      {
        companyName: "New Company",
        addresses: [sampleAddress],
        salespersonPositionId: db.salespersonPositionId,
      },
      db.directorId,
      "director",
    );
    expect(client.assignedTo._id.toString()).toBe(db.salespersonPositionId);
  });

  it("deputy should NOT create client for salesperson outside own superregion", async () => {
    const otherSuperregion = await Region.create({
      name: "South Poland",
      prefix: "SP",
    });
    const otherRegion = await Region.create({
      name: "Lesser Poland",
      prefix: "LP",
      parentRegion: otherSuperregion._id,
    });
    const otherPosition = await Position.create({
      code: "LP-2",
      region: otherRegion._id,
      type: "salesperson",
      currentHolder: null,
    });

    await expect(
      clientService.createClient(
        {
          companyName: "New Company",
          addresses: [sampleAddress],
          salespersonPositionId: otherPosition._id.toString(),
        },
        db.deputyId,
        "deputy",
      ),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ─── updateClient ─────────────────────────────────────────────────────────────

describe("updateClient", () => {
  it("salesperson should update own client", async () => {
    const client = await createTestClient(db);

    const updated = await clientService.updateClient(
      client._id.toString(),
      { companyName: "Updated Company" },
      db.salespersonId,
      "salesperson",
    );

    expect(updated.companyName).toBe("Updated Company");
  });

  it("advisor should update client in own region", async () => {
    const client = await createTestClient(db);

    const updated = await clientService.updateClient(
      client._id.toString(),
      { companyName: "Updated Company" },
      db.advisorId,
      "advisor",
    );

    expect(updated.companyName).toBe("Updated Company");
  });

  it("salesperson should NOT update another salesperson's client", async () => {
    const otherPosition = await Position.create({
      code: "PO-99",
      region: db.regionId,
      type: "salesperson",
      currentHolder: null,
    });
    const client = await createTestClient(db, { assignedTo: otherPosition._id });

    await expect(
      clientService.updateClient(
        client._id.toString(),
        { companyName: "Updated" },
        db.salespersonId,
        "salesperson",
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw NotFoundError for non-existent client", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    await expect(
      clientService.updateClient(fakeId, { companyName: "Updated" }, db.directorId, "director"),
    ).rejects.toThrow(NotFoundError);
  });
});

// ─── updateClientStatus ───────────────────────────────────────────────────────

describe("updateClientStatus", () => {
  it("salesperson should change own client status", async () => {
    const client = await createTestClient(db);

    const updated = await clientService.updateClientStatus(
      client._id.toString(),
      "reminder",
      null,
      db.salespersonId,
      "salesperson",
    );

    expect(updated.status).toBe("reminder");
  });

  it("should require inactivityReason for inactive status", async () => {
    const client = await createTestClient(db);

    await expect(
      clientService.updateClientStatus(
        client._id.toString(),
        "inactive",
        null,
        db.salespersonId,
        "salesperson",
      ),
    ).rejects.toThrow("inactivityReason is required");
  });

  it("should set inactivityReason when status is inactive", async () => {
    const client = await createTestClient(db);

    const updated = await clientService.updateClientStatus(
      client._id.toString(),
      "inactive",
      "No contact",
      db.salespersonId,
      "salesperson",
    );

    expect(updated.status).toBe("inactive");
    expect(updated.inactivityReason).toBe("No contact");
  });

  it("should clear inactivityReason when status changes from inactive", async () => {
    const client = await createTestClient(db, {
      status: "inactive",
      inactivityReason: "No contact",
    });

    const updated = await clientService.updateClientStatus(
      client._id.toString(),
      "active",
      null,
      db.salespersonId,
      "salesperson",
    );

    expect(updated.inactivityReason).toBeNull();
  });

  it("should NOT allow direct archive via status endpoint", async () => {
    const client = await createTestClient(db);

    await expect(
      clientService.updateClientStatus(
        client._id.toString(),
        "archived",
        null,
        db.salespersonId,
        "salesperson",
      ),
    ).rejects.toThrow("Use archive request endpoint");
  });

  it("advisor should NOT change client status", async () => {
    const client = await createTestClient(db);

    await expect(
      clientService.updateClientStatus(
        client._id.toString(),
        "reminder",
        null,
        db.advisorId,
        "advisor",
      ),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ─── requestArchive ───────────────────────────────────────────────────────────

describe("requestArchive", () => {
  it("salesperson should submit archive request", async () => {
    const client = await createTestClient(db);

    const updated = await clientService.requestArchive(
      client._id.toString(),
      "Client closed business",
      db.salespersonId,
      "salesperson",
    );

    expect(updated.archiveRequest.reason).toBe("Client closed business");
    expect(updated.archiveRequest.requestedAt).not.toBeNull();
  });

  it("advisor should NOT submit archive request", async () => {
    const client = await createTestClient(db);

    await expect(
      clientService.requestArchive(
        client._id.toString(),
        "Client closed business",
        db.advisorId,
        "advisor",
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should NOT submit archive request for already archived client", async () => {
    const client = await createTestClient(db, { status: "archived" });

    await expect(
      clientService.requestArchive(
        client._id.toString(),
        "Client closed business",
        db.salespersonId,
        "salesperson",
      ),
    ).rejects.toThrow("already archived");
  });
});

// ─── approveArchive ───────────────────────────────────────────────────────────

describe("approveArchive", () => {
  it("director should approve archive request", async () => {
    const client = await createTestClient(db, {
      archiveRequest: {
        requestedAt: new Date(),
        requestedBy: new mongoose.Types.ObjectId(),
        reason: "Client closed business",
      },
    });

    const updated = await clientService.approveArchive(
      client._id.toString(),
      db.directorId,
      "director",
    );

    expect(updated.status).toBe("archived");
  });

  it("deputy should approve archive request in own superregion", async () => {
    const client = await createTestClient(db, {
      archiveRequest: {
        requestedAt: new Date(),
        requestedBy: new mongoose.Types.ObjectId(),
        reason: "Client closed business",
      },
    });

    const updated = await clientService.approveArchive(
      client._id.toString(),
      db.deputyId,
      "deputy",
    );

    expect(updated.status).toBe("archived");
  });

  it("salesperson should NOT approve archive request", async () => {
    const client = await createTestClient(db, {
      archiveRequest: {
        requestedAt: new Date(),
        requestedBy: new mongoose.Types.ObjectId(),
        reason: "Client closed business",
      },
    });

    await expect(
      clientService.approveArchive(client._id.toString(), db.salespersonId, "salesperson"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw BadRequestError when no archive request exists", async () => {
    const client = await createTestClient(db);

    await expect(
      clientService.approveArchive(client._id.toString(), db.directorId, "director"),
    ).rejects.toThrow("No archive request");
  });
});

// ─── unarchiveClient ──────────────────────────────────────────────────────────

describe("unarchiveClient", () => {
  it("salesperson should unarchive own client", async () => {
    const client = await createTestClient(db, { status: "archived" });

    const updated = await clientService.unarchiveClient(
      client._id.toString(),
      db.salespersonId,
      "salesperson",
    );

    expect(updated.status).toBe("active");
  });

  it("should throw BadRequestError when client is not archived", async () => {
    const client = await createTestClient(db);

    await expect(
      clientService.unarchiveClient(client._id.toString(), db.salespersonId, "salesperson"),
    ).rejects.toThrow("Client is not archived");
  });

  it("advisor should unarchive client in own region", async () => {
    const client = await createTestClient(db, { status: "archived" });

    const updated = await clientService.unarchiveClient(
      client._id.toString(),
      db.advisorId,
      "advisor",
    );

    expect(updated.status).toBe("active");
  });

  it("director should unarchive any client", async () => {
    const client = await createTestClient(db, { status: "archived" });

    const updated = await clientService.unarchiveClient(
      client._id.toString(),
      db.directorId,
      "director",
    );

    expect(updated.status).toBe("active");
  });
});
