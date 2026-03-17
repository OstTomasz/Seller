// server/src/services/client.service.ts
import mongoose from "mongoose";
import Client from "../models/Client";
import Position from "../models/Position";
import User from "../models/User";
import Region from "../models/Region";
import { IClient, IAddress, UserRole } from "../types";
import { BadRequestError, ForbiddenError, NotFoundError } from "../utils/errors";

// ─── helpers ──────────────────────────────────────────────────────────────────

const deepPopulate = (query: mongoose.Query<any, any>) =>
  query
    .populate({
      path: "assignedTo",
      populate: [
        { path: "currentHolder", select: "firstName lastName" },
        {
          path: "region",
          select: "name parentRegion",
          populate: { path: "parentRegion", select: "name" },
        },
      ],
    })
    .populate({
      path: "assignedAdvisor",
      populate: { path: "currentHolder", select: "firstName lastName" },
    });

const deepPopulateDoc = async (client: IClient): Promise<IClient> => {
  await client.populate([
    {
      path: "assignedTo",
      populate: [
        { path: "currentHolder", select: "firstName lastName" },
        {
          path: "region",
          select: "name parentRegion",
          populate: { path: "parentRegion", select: "name" },
        },
      ],
    },
    {
      path: "assignedAdvisor",
      populate: { path: "currentHolder", select: "firstName lastName" },
    },
  ]);
  return client;
};

const getAdvisorPosition = async (regionId: string) => {
  const region = await Region.findById(regionId);
  if (!region) throw new NotFoundError("Region not found");
  return (await Position.findOne({ region: regionId, type: "advisor" })) ?? null;
};

const getRegionFromPosition = async (positionId: string): Promise<string | null> => {
  const position = await Position.findById(positionId);
  return position?.region?.toString() ?? null;
};

const getPositionIdsInSuperregion = async (deputyUserId: string): Promise<string[]> => {
  const deputyUser = await User.findById(deputyUserId).populate("position");
  if (!deputyUser?.position) return [];

  const deputyPosition = await Position.findById(deputyUser.position);
  if (!deputyPosition?.region) return [];

  const superregionId = deputyPosition.region.toString();
  const subregions = await Region.find({ parentRegion: superregionId });
  const subregionIds = subregions.map((r) => r._id.toString());

  const positions = await Position.find({ region: { $in: subregionIds } });
  return positions.map((p) => p._id.toString());
};

const verifyAdvisorAccess = async (
  advisorUserId: string,
  targetPositionId: string,
): Promise<void> => {
  const advisorUser = await User.findById(advisorUserId);
  if (!advisorUser?.position) throw new ForbiddenError();

  const advisorPosition = await Position.findById(advisorUser.position);
  if (!advisorPosition?.region) throw new ForbiddenError();

  const targetPosition = await Position.findById(targetPositionId);
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
    const user = await User.findById(requesterId);
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
    return await deepPopulate(Client.find().sort({ companyName: 1 }));
  }

  if (requesterRole === "salesperson") {
    const user = await User.findById(requesterId);
    if (!user?.position) return [];
    return await deepPopulate(Client.find({ assignedTo: user.position }).sort({ companyName: 1 }));
  }

  if (requesterRole === "advisor") {
    const user = await User.findById(requesterId);
    if (!user?.position) return [];
    return await deepPopulate(
      Client.find({ assignedAdvisor: user.position }).sort({ companyName: 1 }),
    );
  }

  if (requesterRole === "deputy") {
    const positionIds = await getPositionIdsInSuperregion(requesterId);
    if (positionIds.length === 0) return [];
    return await deepPopulate(
      Client.find({ assignedTo: { $in: positionIds } }).sort({ companyName: 1 }),
    );
  }

  return [];
};

export const getClientById = async (
  clientId: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await Client.findById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);
  return await deepPopulateDoc(client);
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
    const user = await User.findById(requesterId);
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

    const advisorUser = await User.findById(requesterId);
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

  const client = await Client.create({
    companyName: data.companyName,
    nip: data.nip ?? null,
    notes: [],
    addresses: data.addresses,
    assignedTo: assignedToPositionId,
    assignedAdvisor: assignedAdvisorPositionId,
    status: "active",
    lastActivityAt: new Date(),
  });

  return await deepPopulateDoc(client);
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
  const client = await Client.findById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  return (await deepPopulate(
    Client.findByIdAndUpdate(
      clientId,
      { ...data },
      { returnDocument: "after", runValidators: true },
    ),
  )) as IClient;
};

export const updateClientStatus = async (
  clientId: string,
  status: string,
  inactivityReason: string | null,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await Client.findById(clientId);
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

  return (await deepPopulate(
    Client.findByIdAndUpdate(clientId, updateData, {
      returnDocument: "after",
      runValidators: true,
    }),
  )) as IClient;
};

export const requestArchive = async (
  clientId: string,
  reason: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await Client.findById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  if (requesterRole !== "salesperson") throw new ForbiddenError();
  if (client.status === "archived") throw new BadRequestError("Client is already archived");

  return (await deepPopulate(
    Client.findByIdAndUpdate(
      clientId,
      { archiveRequest: { requestedAt: new Date(), requestedBy: requesterId, reason } },
      { returnDocument: "after" },
    ),
  )) as IClient;
};

export const approveArchive = async (
  clientId: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  if (requesterRole !== "deputy" && requesterRole !== "director") throw new ForbiddenError();

  const client = await Client.findById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  if (!client.archiveRequest.requestedAt) {
    throw new BadRequestError("No archive request found for this client");
  }

  if (requesterRole === "deputy") {
    await verifyDeputyAccess(requesterId, client.assignedTo.toString());
  }

  return (await deepPopulate(
    Client.findByIdAndUpdate(
      clientId,
      {
        status: "archived",
        "archiveRequest.requestedAt": null,
        "archiveRequest.requestedBy": null,
        "archiveRequest.reason": null,
      },
      { returnDocument: "after" },
    ),
  )) as IClient;
};

export const unarchiveClient = async (
  clientId: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await Client.findById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  if (client.status !== "archived") throw new BadRequestError("Client is not archived");

  await verifyClientAccess(client, requesterId, requesterRole);

  return (await deepPopulate(
    Client.findByIdAndUpdate(
      clientId,
      { status: "active", lastActivityAt: new Date() },
      { returnDocument: "after" },
    ),
  )) as IClient;
};

export const updateClientSalesperson = async (
  clientId: string,
  salespersonPositionId: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await Client.findById(clientId);
  if (!client) throw new NotFoundError("Client not found");

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

  return (await deepPopulate(
    Client.findByIdAndUpdate(
      clientId,
      { assignedTo: salespersonPositionId, assignedAdvisor: assignedAdvisorPositionId },
      { returnDocument: "after", runValidators: true },
    ),
  )) as IClient;
};

export const addNote = async (
  clientId: string,
  content: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await Client.findById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  client.notes.push({ content, createdBy: new mongoose.Types.ObjectId(requesterId) } as any);
  await client.save();

  return await deepPopulateDoc(client);
};

export const updateNote = async (
  clientId: string,
  noteId: string,
  content: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await Client.findById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  const note = client.notes.find((n) => n._id.toString() === noteId);
  if (!note) throw new NotFoundError("Note not found");

  // only note author or director can edit
  if (note.createdBy.toString() !== requesterId && requesterRole !== "director") {
    throw new ForbiddenError();
  }

  note.content = content;
  await client.save();

  return await deepPopulateDoc(client);
};

export const deleteNote = async (
  clientId: string,
  noteId: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await Client.findById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  const noteIndex = client.notes.findIndex((n) => n._id.toString() === noteId);
  if (noteIndex === -1) throw new NotFoundError("Note not found");

  const note = client.notes[noteIndex];

  // only note author or director can delete
  if (note.createdBy.toString() !== requesterId && requesterRole !== "director") {
    throw new ForbiddenError();
  }

  client.notes.splice(noteIndex, 1);
  await client.save();

  return await deepPopulateDoc(client);
};

export const addAddress = async (
  clientId: string,
  data: { label: string; street: string; city: string; postalCode: string },
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await Client.findById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  client.addresses.push({ ...data, contacts: [] } as any);
  await client.save();

  return await deepPopulateDoc(client);
};

export const updateAddress = async (
  clientId: string,
  addressId: string,
  data: { label?: string; street?: string; city?: string; postalCode?: string },
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await Client.findById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  const address = client.addresses.find((a) => a._id.toString() === addressId);
  if (!address) throw new NotFoundError("Address not found");

  if (data.label) address.label = data.label;
  if (data.street) address.street = data.street;
  if (data.city) address.city = data.city;
  if (data.postalCode) address.postalCode = data.postalCode;

  await client.save();

  return await deepPopulateDoc(client);
};

export const deleteAddress = async (
  clientId: string,
  addressId: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await Client.findById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  if (client.addresses.length <= 1) {
    throw new BadRequestError("Client must have at least one address");
  }

  const addressIndex = client.addresses.findIndex((a) => a._id.toString() === addressId);
  if (addressIndex === -1) throw new NotFoundError("Address not found");

  client.addresses.splice(addressIndex, 1);
  await client.save();

  return await deepPopulateDoc(client);
};

export const addContact = async (
  clientId: string,
  addressId: string,
  data: { firstName: string; lastName: string; phone: string | null; email: string | null },
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await Client.findById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  const address = client.addresses.find((a) => a._id.toString() === addressId);
  if (!address) throw new NotFoundError("Address not found");

  address.contacts.push(data as any);
  await client.save();

  return await deepPopulateDoc(client);
};

export const updateContact = async (
  clientId: string,
  addressId: string,
  contactId: string,
  data: { firstName?: string; lastName?: string; phone?: string | null; email?: string | null },
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await Client.findById(clientId);
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

  return await deepPopulateDoc(client);
};

export const deleteContact = async (
  clientId: string,
  addressId: string,
  contactId: string,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IClient> => {
  const client = await Client.findById(clientId);
  if (!client) throw new NotFoundError("Client not found");

  await verifyClientAccess(client, requesterId, requesterRole);

  const address = client.addresses.find((a) => a._id.toString() === addressId);
  if (!address) throw new NotFoundError("Address not found");

  const contactIndex = address.contacts.findIndex((c) => c._id.toString() === contactId);
  if (contactIndex === -1) throw new NotFoundError("Contact not found");

  address.contacts.splice(contactIndex, 1);
  await client.save();

  return await deepPopulateDoc(client);
};
