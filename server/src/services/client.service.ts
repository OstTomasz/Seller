import mongoose from "mongoose";
import { IClient, IAddress, UserRole } from "../types";
import { BadRequestError, ForbiddenError, NotFoundError } from "../utils/errors";
import * as clientRepository from "../repositories/client.repository";
import * as positionRepository from "../repositories/position.repository";
import * as regionRepository from "../repositories/region.repository";
import * as userRepository from "../repositories/user.repository";
import * as notificationService from "./notification.service";
import { getPositionIdsInSuperregion } from "../utils/rbac";
import { NipCheckResult } from "@seller/shared/types";

// ─── helpers ──────────────────────────────────────────────────────────────────

const getAdvisorPosition = async (regionId: string) => {
  const region = await regionRepository.findRegionById(regionId);
  if (!region) throw new NotFoundError("Region not found");
  return (await positionRepository.findAdvisorPositionByRegionId(regionId)) ?? null;
};

const getRegionFromPosition = async (positionId: string): Promise<string | null> => {
  const position = await positionRepository.findPositionById(positionId);
  return position?.region?.toString() ?? null;
};

const verifyAdvisorAccess = async (
  advisorUserId: string,
  targetPositionId: string,
): Promise<void> => {
  const advisorUser = await userRepository.findRawUserById(advisorUserId);
  if (!advisorUser?.position) throw new ForbiddenError();

  const advisorPosition = await positionRepository.findPositionById(
    advisorUser.position.toString(),
  );
  if (!advisorPosition?.region) throw new ForbiddenError();

  const targetPosition = await positionRepository.findPositionById(targetPositionId);
  if (!targetPosition) throw new NotFoundError("Position not found");

  if (advisorPosition.region.toString() !== targetPosition.region?.toString()) {
    throw new ForbiddenError();
  }
};

const verifyDeputyAccess = async (
  deputyUserId: string,
  targetPositionId: string,
): Promise<void> => {
  const allowedPositionIds = await getPositionIdsInSuperregion(deputyUserId);
  if (!allowedPositionIds.includes(targetPositionId)) throw new ForbiddenError();
};

const verifyClientAccess = async (
  client: IClient,
  requesterId: string,
  requesterRole: UserRole,
): Promise<void> => {
  if (requesterRole === "director") return;

  const assignedToId = client.assignedTo.toString();

  if (requesterRole === "salesperson") {
    const user = await userRepository.findRawUserById(requesterId);
    if (user?.position?.toString() !== assignedToId) throw new ForbiddenError();
    return;
  }
  if (requesterRole === "advisor") {
    await verifyAdvisorAccess(requesterId, assignedToId);
    return;
  }
  if (requesterRole === "deputy") {
    await verifyDeputyAccess(requesterId, assignedToId);
    return;
  }

  throw new ForbiddenError();
};

// ─── service functions ────────────────────────────────────────────────────────

export const getClients = async (
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient[]> => {
  if (requesterRole === "director") {
    return clientRepository.findClientsForDirector();
  }

  if (requesterRole === "salesperson") {
    const user = await userRepository.findRawUserById(requesterId);
    if (!user?.position) return [];
    return clientRepository.findClientsForSalesperson(user.position.toString());
  }

  if (requesterRole === "advisor") {
    const user = await userRepository.findRawUserById(requesterId);
    if (!user?.position) return [];
    return clientRepository.findClientsForAdvisor(user.position.toString());
  }

  if (requesterRole === "deputy") {
    const positionIds = await getPositionIdsInSuperregion(requesterId);
    if (positionIds.length === 0) return [];
    return clientRepository.findClientsForDeputy(positionIds);
  }

  return [];
};

export const getClientById = async (
  clientId: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await clientRepository.findClientById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);
  const populated = await clientRepository.findClientByIdPopulated(clientId);
  if (!populated) throw new NotFoundError("Client not found");
  return populated;
};

export const createClient = async (
  data: {
    companyName: string;
    nip?: string | null;
    notes?: string | null;
    addresses: IAddress[];
    salespersonPositionId?: string;
  },
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  let assignedToPositionId: string;
  let assignedAdvisorPositionId: string | null = null;

  if (requesterRole === "salesperson") {
    const user = await userRepository.findRawUserById(requesterId);
    if (!user?.position) throw new ForbiddenError();

    assignedToPositionId = user.position.toString();
    const regionId = await getRegionFromPosition(assignedToPositionId);
    if (regionId) {
      const advisorPos = await getAdvisorPosition(regionId);
      assignedAdvisorPositionId = advisorPos?._id.toString() ?? null;
    }
  } else if (requesterRole === "advisor") {
    if (!data.salespersonPositionId) throw new BadRequestError("salespersonPositionId is required");

    await verifyAdvisorAccess(requesterId, data.salespersonPositionId);
    assignedToPositionId = data.salespersonPositionId;

    const advisorUser = await userRepository.findRawUserById(requesterId);
    assignedAdvisorPositionId = advisorUser?.position?.toString() ?? null;
  } else {
    if (!data.salespersonPositionId) throw new BadRequestError("salespersonPositionId is required");

    if (requesterRole === "deputy") {
      await verifyDeputyAccess(requesterId, data.salespersonPositionId);
    }

    assignedToPositionId = data.salespersonPositionId;
    const regionId = await getRegionFromPosition(assignedToPositionId);
    if (regionId) {
      const advisorPos = await getAdvisorPosition(regionId);
      assignedAdvisorPositionId = advisorPos?._id.toString() ?? null;
    }
  }

  const created = await clientRepository.createClient({
    companyName: data.companyName,
    nip: data.nip ?? null,
    addresses: data.addresses,
    assignedTo: assignedToPositionId,
    assignedAdvisor: assignedAdvisorPositionId,
  });

  const populated = await clientRepository.findClientByIdPopulated(created._id.toString());
  if (!populated) throw new NotFoundError("Client not found");
  return populated;
};

export const updateClient = async (
  clientId: string,
  data: {
    companyName?: string;
    nip?: string | null;
    notes?: string | null;
    addresses?: IAddress[];
  },
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await clientRepository.findClientById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  const updated = await clientRepository.updateClientById(clientId, { ...data });
  if (!updated) throw new NotFoundError("Client not found");
  return updated;
};

export const updateClientStatus = async (
  clientId: string,
  status: string,
  inactivityReason: string | null,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await clientRepository.findClientById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  if (requesterRole === "advisor") throw new ForbiddenError();

  if (status === "inactive" && !inactivityReason) {
    throw new BadRequestError("inactivityReason is required when status is inactive");
  }

  if (status === "archived") {
    throw new BadRequestError("Use archive request endpoint to archive a client");
  }

  const updateData: Record<string, unknown> = { status };
  if (status === "inactive") {
    updateData.inactivityReason = inactivityReason;
  } else {
    updateData.inactivityReason = null;
    updateData.lastActivityAt = new Date();
  }

  const updated = await clientRepository.updateClientById(clientId, updateData);
  if (!updated) throw new NotFoundError("Client not found");
  return updated;
};

export const updateClientSalesperson = async (
  clientId: string,
  salespersonPositionId: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await clientRepository.findClientById(clientId);
  if (!client) throw new NotFoundError("Client not found");
  if (requesterRole === "salesperson") throw new ForbiddenError();

  await verifyClientAccess(client, requesterId, requesterRole);

  // verify new salesperson position exists and belongs to correct region
  if (requesterRole === "advisor") {
    await verifyAdvisorAccess(requesterId, salespersonPositionId);
  }
  if (requesterRole === "deputy") {
    await verifyDeputyAccess(requesterId, salespersonPositionId);
  }

  // auto-assign advisor from new salesperson's region
  const regionId = await getRegionFromPosition(salespersonPositionId);
  let assignedAdvisorPositionId: string | null = null;
  if (regionId) {
    const advisorPos = await getAdvisorPosition(regionId);
    assignedAdvisorPositionId = advisorPos?._id.toString() ?? null;
  }

  const updated = await clientRepository.updateClientById(clientId, {
    assignedTo: salespersonPositionId,
    assignedAdvisor: assignedAdvisorPositionId,
  });
  if (!updated) throw new NotFoundError("Client not found");
  return updated;
};

export const addNote = async (
  clientId: string,
  content: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await clientRepository.findClientById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  const newNote = { content, createdBy: new mongoose.Types.ObjectId(requesterId) };
  client.notes.push(newNote as unknown as (typeof client.notes)[number]);
  await client.save();

  const populated = await clientRepository.findClientByIdPopulated(clientId);
  if (!populated) throw new NotFoundError("Client not found");
  return populated;
};

export const updateNote = async (
  clientId: string,
  noteId: string,
  content: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await clientRepository.findClientById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  const note = client.notes.find((n) => n._id.toString() === noteId);
  if (!note) throw new NotFoundError("Note not found");

  const canEditNote =
    note.createdBy.toString() === requesterId ||
    requesterRole === "director" ||
    requesterRole === "deputy";
  if (!canEditNote) {
    throw new ForbiddenError();
  }

  note.content = content;
  await client.save();

  const populated = await clientRepository.findClientByIdPopulated(clientId);
  if (!populated) throw new NotFoundError("Client not found");
  return populated;
};

export const deleteNote = async (
  clientId: string,
  noteId: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await clientRepository.findClientById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  const noteIndex = client.notes.findIndex((n) => n._id.toString() === noteId);
  if (noteIndex === -1) throw new NotFoundError("Note not found");

  const note = client.notes[noteIndex];

  // only note author or director can delete
  const canDeleteNote =
    note.createdBy.toString() === requesterId ||
    requesterRole === "director" ||
    requesterRole === "deputy";
  if (!canDeleteNote) {
    throw new ForbiddenError();
  }

  client.notes.splice(noteIndex, 1);
  await client.save();

  const populated = await clientRepository.findClientByIdPopulated(clientId);
  if (!populated) throw new NotFoundError("Client not found");
  return populated;
};

export const addAddress = async (
  clientId: string,
  data: { label: string; street: string; city: string; postalCode: string },
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await clientRepository.findClientById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  const newAddress = { ...data, contacts: [] };
  client.addresses.push(newAddress as unknown as (typeof client.addresses)[number]);
  await client.save();

  const populated = await clientRepository.findClientByIdPopulated(clientId);
  if (!populated) throw new NotFoundError("Client not found");
  return populated;
};

export const updateAddress = async (
  clientId: string,
  addressId: string,
  data: { label?: string; street?: string; city?: string; postalCode?: string },
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await clientRepository.findClientById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  const address = client.addresses.find((a) => a._id.toString() === addressId);
  if (!address) throw new NotFoundError("Address not found");

  if (data.label) address.label = data.label;
  if (data.street) address.street = data.street;
  if (data.city) address.city = data.city;
  if (data.postalCode) address.postalCode = data.postalCode;

  await client.save();

  const populated = await clientRepository.findClientByIdPopulated(clientId);
  if (!populated) throw new NotFoundError("Client not found");
  return populated;
};

export const deleteAddress = async (
  clientId: string,
  addressId: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await clientRepository.findClientById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  if (client.addresses.length <= 1) {
    throw new BadRequestError("Client must have at least one address");
  }

  const addressIndex = client.addresses.findIndex((a) => a._id.toString() === addressId);
  if (addressIndex === -1) throw new NotFoundError("Address not found");

  client.addresses.splice(addressIndex, 1);
  await client.save();

  const populated = await clientRepository.findClientByIdPopulated(clientId);
  if (!populated) throw new NotFoundError("Client not found");
  return populated;
};

export const addContact = async (
  clientId: string,
  addressId: string,
  data: { firstName: string; lastName: string; phone: string | null; email: string | null },
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await clientRepository.findClientById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  const address = client.addresses.find((a) => a._id.toString() === addressId);
  if (!address) throw new NotFoundError("Address not found");

  address.contacts.push(data as unknown as (typeof address.contacts)[number]);
  await client.save();

  const populated = await clientRepository.findClientByIdPopulated(clientId);
  if (!populated) throw new NotFoundError("Client not found");
  return populated;
};

export const updateContact = async (
  clientId: string,
  addressId: string,
  contactId: string,
  data: { firstName?: string; lastName?: string; phone?: string | null; email?: string | null },
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await clientRepository.findClientById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  const address = client.addresses.find((a) => a._id.toString() === addressId);
  if (!address) throw new NotFoundError("Address not found");

  const contact = address.contacts.find((c) => c._id.toString() === contactId);
  if (!contact) throw new NotFoundError("Contact not found");

  if (data.firstName !== undefined) contact.firstName = data.firstName;
  if (data.lastName !== undefined) contact.lastName = data.lastName;
  if (data.phone !== undefined) contact.phone = data.phone;
  if (data.email !== undefined) contact.email = data.email;

  await client.save();

  const populated = await clientRepository.findClientByIdPopulated(clientId);
  if (!populated) throw new NotFoundError("Client not found");
  return populated;
};

export const deleteContact = async (
  clientId: string,
  addressId: string,
  contactId: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await clientRepository.findClientById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  const address = client.addresses.find((a) => a._id.toString() === addressId);
  if (!address) throw new NotFoundError("Address not found");

  const contactIndex = address.contacts.findIndex((c) => c._id.toString() === contactId);
  if (contactIndex === -1) throw new NotFoundError("Contact not found");

  address.contacts.splice(contactIndex, 1);
  await client.save();

  const populated = await clientRepository.findClientByIdPopulated(clientId);
  if (!populated) throw new NotFoundError("Client not found");
  return populated;
};

export const requestArchive = async (
  clientId: string,
  reason: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await clientRepository.findClientById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  if (requesterRole !== "salesperson" && requesterRole !== "deputy") throw new ForbiddenError();
  if (client.status === "archived") throw new BadRequestError("Client is already archived");

  const updated = await clientRepository.updateClientById(clientId, {
    archiveRequest: { requestedAt: new Date(), requestedBy: requesterId, reason },
  });
  if (!updated) throw new NotFoundError("Client not found");

  // ── send notification to deputy and director ───────────────────────────────

  await notificationService.notifyArchiveRequest(
    clientId,
    client.companyName,
    reason,
    client.assignedTo.toString(),
    requesterRole,
  );

  return updated;
};

export const approveArchive = async (
  clientId: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  if (requesterRole !== "deputy" && requesterRole !== "director") throw new ForbiddenError();

  const client = await clientRepository.findClientById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  if (!client.archiveRequest.requestedAt) {
    throw new BadRequestError("No archive request found for this client");
  }

  if (requesterRole === "deputy") {
    await verifyDeputyAccess(requesterId, client.assignedTo.toString());
  }

  const updated = await clientRepository.updateClientById(clientId, {
    status: "archived",
    "archiveRequest.requestedAt": null,
    "archiveRequest.requestedBy": null,
    "archiveRequest.reason": null,
  });
  if (!updated) throw new NotFoundError("Client not found");

  // cleanup archive_request notifications + notify about archival
  await notificationService.deleteArchiveRequestNotifications(clientId); // ← nowe
  await notificationService.notifyClientArchived(
    clientId,
    client.companyName,
    client.assignedTo.toString(),
    client.archiveRequest.reason ?? "",
  );

  return updated;
};

export const rejectArchive = async (
  clientId: string,
  reason: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  if (requesterRole !== "deputy" && requesterRole !== "director") throw new ForbiddenError();

  const client = await clientRepository.findClientById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  if (!client.archiveRequest.requestedAt) {
    throw new BadRequestError("No archive request found for this client");
  }

  if (requesterRole === "deputy") {
    await verifyDeputyAccess(requesterId, client.assignedTo.toString());
  }

  const updated = await clientRepository.updateClientById(clientId, {
    "archiveRequest.requestedAt": null,
    "archiveRequest.requestedBy": null,
    "archiveRequest.reason": null,
  });
  if (!updated) throw new NotFoundError("Client not found");

  // cleanup archive_request notifications + notify salesperson
  await notificationService.deleteArchiveRequestNotifications(clientId);
  await notificationService.notifyArchiveRejected(
    clientId,
    client.companyName,
    client.assignedTo.toString(),
    reason,
  );

  return updated;
};

export const directArchive = async (
  clientId: string,
  reason: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  if (requesterRole !== "deputy" && requesterRole !== "director") throw new ForbiddenError();

  const client = await clientRepository.findClientById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  if (client.status === "archived") throw new BadRequestError("Client is already archived");

  const updated = await clientRepository.updateClientById(clientId, {
    status: "archived",
    "archiveRequest.reason": reason,
    "archiveRequest.requestedAt": null,
    "archiveRequest.requestedBy": null,
  });
  if (!updated) throw new NotFoundError("Client not found");

  await notificationService.deleteArchiveRequestNotifications(clientId);
  await notificationService.notifyClientArchived(
    clientId,
    client.companyName,
    client.assignedTo.toString(),
    reason,
  );

  return updated;
};

export const unarchiveClient = async (
  clientId: string,
  reason: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  if (requesterRole !== "director") throw new ForbiddenError();
  if (!reason?.trim()) throw new BadRequestError("Reason is required");

  const client = await clientRepository.findClientById(clientId);
  if (!client) throw new NotFoundError("Client not found");
  if (client.status !== "archived") throw new BadRequestError("Client is not archived");

  const updated = await clientRepository.updateClientById(clientId, {
    status: "active",
    lastActivityAt: new Date(),
    inactivityReason: null,
    "archiveRequest.requestedAt": null,
    "archiveRequest.requestedBy": null,
    "archiveRequest.reason": null,
  });
  if (!updated) throw new NotFoundError("Client not found");

  await notificationService.deleteUnarchiveRequestNotifications(clientId);
  await notificationService.notifyClientUnarchived(
    clientId,
    client.companyName,
    client.assignedTo.toString(),
    reason,
  );

  return updated;
};

export const rejectUnarchive = async (
  clientId: string,
  reason: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<void> => {
  if (requesterRole !== "director") throw new ForbiddenError();

  const client = await clientRepository.findClientById(clientId);
  if (!client) throw new NotFoundError("Client not found");
  if (client.status !== "archived") throw new BadRequestError("Client is not archived");

  await notificationService.deleteUnarchiveRequestNotifications(clientId);
  await notificationService.notifyUnarchiveRejected(
    clientId,
    client.companyName,
    client.assignedTo.toString(),
    reason,
  );
};

export const checkNipInArchive = async (
  nip: string,
): Promise<{ archived: boolean; clientId: string | null; companyName: string | null }> => {
  const client = await clientRepository.findArchivedClientByNip(nip);
  if (!client) return { archived: false, clientId: null, companyName: null };
  return {
    archived: true,
    clientId: client._id.toString(),
    companyName: client.companyName,
  };
};

export const getArchivedClients = async (requesterRole: UserRole): Promise<IClient[]> => {
  if (requesterRole !== "director") throw new ForbiddenError();
  return clientRepository.findArchivedClients();
};

/**
 * Returns clients visible to the requesting user for event assignment.
 * Reuses existing RBAC repository functions.
 */
export const getClientsForEvent = async (userId: string, role: UserRole): Promise<IClient[]> => {
  if (role === "director") {
    return clientRepository.findClientsForDirector();
  }

  const position = await positionRepository.findPositionByUserId(userId);
  if (!position) return [];

  if (role === "advisor") {
    return clientRepository.findClientsForAdvisor(position._id.toString());
  }

  if (role === "salesperson") {
    return clientRepository.findClientsForSalesperson(position._id.toString());
  }

  if (role === "deputy") {
    const region = position.region;
    if (!region) return [];

    const regionId = (region as unknown as { _id: { toString(): string } })._id.toString();

    const subRegions = await regionRepository.findSubregionsByParentId(regionId);
    const allRegionIds = [regionId, ...subRegions.map((r) => r._id.toString())];
    const positions = await positionRepository.findPositionsByRegionIds(allRegionIds);
    const positionIds = positions.map((p) => p._id.toString());
    return clientRepository.findClientsForDeputy(positionIds);
  }

  return [];
};

/**
 * Checks NIP against active clients (for given SP) and archive.
 * @param nip - 10-digit NIP
 * @param salespersonPositionId - optional, required for active check
 */
export const checkNip = async (
  nip: string,
  salespersonPositionId?: string,
): Promise<NipCheckResult> => {
  if (salespersonPositionId) {
    const active = await clientRepository.findActiveClientByNipAndSalesperson(
      nip,
      salespersonPositionId,
    );
    if (active) {
      const pos = active.assignedTo as unknown as {
        user?: { firstName?: string; lastName?: string };
      };
      const salespersonName = pos?.user
        ? `${pos.user.firstName ?? ""} ${pos.user.lastName ?? ""}`.trim()
        : "the assigned salesperson";
      return {
        status: "active",
        clientId: active._id.toString(),
        companyName: active.companyName,
        salespersonName,
      };
    }
  }

  const archived = await clientRepository.findArchivedClientByNip(nip);
  if (archived) {
    return {
      status: "archived",
      clientId: archived._id.toString(),
      companyName: archived.companyName,
    };
  }

  return { status: "free" };
};
