import Client from "../models/Client";
import type { IClient, IAddress, UserRole } from "../types";
import mongoose from "mongoose";

const deepPopulate = (query: mongoose.Query<unknown, unknown>) =>
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
    })
    .populate({
      path: "notes.createdBy",
      select: "firstName lastName role",
    });

export const findClientById = async (clientId: string): Promise<IClient | null> =>
  Client.findById(clientId);

export const findClientByIdPopulated = async (clientId: string): Promise<IClient | null> =>
  (await deepPopulate(Client.findById(clientId))) as IClient | null;

export const findClientsForDirector = async (): Promise<IClient[]> =>
  (await deepPopulate(
    Client.find({ status: { $ne: "archived" } }).sort({ companyName: 1 }),
  )) as IClient[];

export const findClientsForSalesperson = async (positionId: string): Promise<IClient[]> =>
  (await deepPopulate(
    Client.find({ assignedTo: positionId, status: { $ne: "archived" } }).sort({ companyName: 1 }),
  )) as IClient[];

export const findClientsForAdvisor = async (positionId: string): Promise<IClient[]> =>
  (await deepPopulate(
    Client.find({ assignedAdvisor: positionId, status: { $ne: "archived" } }).sort({
      companyName: 1,
    }),
  )) as IClient[];

export const findClientsForDeputy = async (positionIds: string[]): Promise<IClient[]> =>
  (await deepPopulate(
    Client.find({ assignedTo: { $in: positionIds }, status: { $ne: "archived" } }).sort({
      companyName: 1,
    }),
  )) as IClient[];

export const createClient = async (data: {
  companyName: string;
  nip: string | null;
  addresses: IAddress[];
  assignedTo: string;
  assignedAdvisor: string | null;
}): Promise<IClient> =>
  Client.create({
    companyName: data.companyName,
    nip: data.nip,
    notes: [],
    addresses: data.addresses,
    assignedTo: data.assignedTo,
    assignedAdvisor: data.assignedAdvisor,
    status: "active",
    lastActivityAt: new Date(),
  });

export const updateClientById = async (
  clientId: string,
  update: Record<string, unknown>,
): Promise<IClient | null> =>
  (await deepPopulate(
    Client.findByIdAndUpdate(clientId, update, {
      returnDocument: "after",
      runValidators: true,
    }),
  )) as IClient | null;

export const findArchivedClientByNip = async (nip: string): Promise<IClient | null> =>
  Client.findOne({ nip, status: "archived" });

export const findArchivedClients = async (): Promise<IClient[]> =>
  (await deepPopulate(Client.find({ status: "archived" }).sort({ companyName: 1 }))) as IClient[];

/** Finds any non-archived client by NIP assigned to a specific salesperson position */
export const findActiveClientByNipAndSalesperson = async (
  nip: string,
  salespersonPositionId: string,
): Promise<IClient | null> =>
  Client.findOne({ nip, assignedTo: salespersonPositionId, status: { $ne: "archived" } })
    .populate("assignedTo")
    .lean();
