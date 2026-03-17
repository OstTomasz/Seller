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
