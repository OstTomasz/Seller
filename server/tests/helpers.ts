import request from "supertest";
import app from "../src/app";
import mongoose, { Types } from "mongoose";
import User from "../src/models/User";
import Region from "../src/models/Region";
import Position from "../src/models/Position";
import Client from "../src/models/Client";
import Notification from "../src/models/Notification";
import { INotification } from "src/types";
import EventModel from "../src/models/Event";

interface ClientTestBase {
  salespersonPositionId: string;
  advisorPositionId: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createTestClient = async (ctx: ClientTestBase, overrides: any = {}) =>
  await Client.create({
    companyName: "Test Company",
    assignedTo: ctx.salespersonPositionId,
    assignedAdvisor: ctx.advisorPositionId,
    status: "active",
    addresses: [createSampleAddress()],
    notes: [],
    ...overrides,
  });

export const loginAs = async (email: string, password = "password123"): Promise<string> => {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.token;
};

export interface TestDB {
  directorId: string;
  deputyId: string;
  advisorId: string;
  salespersonId: string;
  superregionId: string;
  regionId: string;
  otherRegionId: string;
  directorPositionId: string;
  deputyPositionId: string;
  advisorPositionId: string;
  salespersonPositionId: string;
}

export interface TestContext extends TestDB {
  directorToken: string;
  deputyToken: string;
  advisorToken: string;
  salespersonToken: string;
}

export const createTestDB = async (): Promise<TestDB> => {
  // regions
  const superregion = await Region.create({
    name: "North Poland",
    prefix: "NP",
  });
  const region = await Region.create({
    name: "Pomerania",
    prefix: "PO",
    parentRegion: superregion._id,
  });
  const otherRegion = await Region.create({
    name: "Silesia",
    prefix: "SL",
    parentRegion: superregion._id,
  });

  // positions (vacant first, assign holders after)
  const directorPosition = await Position.create({
    code: "DIR-1",
    region: null,
    type: "director",
    currentHolder: null,
  });

  const deputyPosition = await Position.create({
    code: "NP-1",
    region: superregion._id,
    type: "deputy",
    currentHolder: null,
  });

  const advisorPosition = await Position.create({
    code: "PO-1",
    region: region._id,
    type: "advisor",
    currentHolder: null,
  });

  const salespersonPosition = await Position.create({
    code: "PO-2",
    region: region._id,
    type: "salesperson",
    currentHolder: null,
  });

  // assign deputy position to superregion
  await Region.findByIdAndUpdate(superregion._id, {
    deputy: deputyPosition._id,
  });

  // users
  const director = await User.create({
    firstName: "Jan",
    lastName: "Director",
    email: "director@seller.com",
    password: "password123",
    role: "director",
    mustChangePassword: false,
    position: directorPosition._id,
  });

  const deputy = await User.create({
    firstName: "Anna",
    lastName: "Deputy",
    email: "deputy@seller.com",
    password: "password123",
    role: "deputy",
    mustChangePassword: false,
    position: deputyPosition._id,
  });

  const advisor = await User.create({
    firstName: "Piotr",
    lastName: "Advisor",
    email: "advisor@seller.com",
    password: "password123",
    role: "advisor",
    grade: 1,
    mustChangePassword: false,
    position: advisorPosition._id,
  });

  const salesperson = await User.create({
    firstName: "Marek",
    lastName: "Salesperson",
    email: "salesperson@seller.com",
    password: "password123",
    role: "salesperson",
    grade: 1,
    mustChangePassword: false,
    position: salespersonPosition._id,
  });

  // update position holders
  await Promise.all([
    Position.findByIdAndUpdate(directorPosition._id, {
      currentHolder: director._id,
    }),
    Position.findByIdAndUpdate(deputyPosition._id, {
      currentHolder: deputy._id,
    }),
    Position.findByIdAndUpdate(advisorPosition._id, {
      currentHolder: advisor._id,
    }),
    Position.findByIdAndUpdate(salespersonPosition._id, {
      currentHolder: salesperson._id,
    }),
  ]);

  return {
    directorId: director._id.toString(),
    deputyId: deputy._id.toString(),
    advisorId: advisor._id.toString(),
    salespersonId: salesperson._id.toString(),
    superregionId: superregion._id.toString(),
    regionId: region._id.toString(),
    otherRegionId: otherRegion._id.toString(),
    directorPositionId: directorPosition._id.toString(),
    deputyPositionId: deputyPosition._id.toString(),
    advisorPositionId: advisorPosition._id.toString(),
    salespersonPositionId: salespersonPosition._id.toString(),
  };
};

export const createTestContext = async (): Promise<TestContext> => {
  const db = await createTestDB();

  const [directorToken, deputyToken, advisorToken, salespersonToken] = await Promise.all([
    loginAs("director@seller.com"),
    loginAs("deputy@seller.com"),
    loginAs("advisor@seller.com"),
    loginAs("salesperson@seller.com"),
  ]);

  return { ...db, directorToken, deputyToken, advisorToken, salespersonToken };
};

const createSampleAddress = () => ({
  _id: new Types.ObjectId(),
  label: "Headquarters",
  street: "Main St 1",
  city: "Gdansk",
  postalCode: "80-001",
  contacts: [],
});

export const sampleAddress = createSampleAddress();

export const newAddress = {
  label: "Warehouse",
  street: "Industrial Rd 5",
  city: "Gdynia",
  postalCode: "81-002",
};

export const createTestNotification = async (
  userId: string,
  clientId: string,
  read = false,
): Promise<INotification> => {
  const doc = await Notification.create({
    userId: new mongoose.Types.ObjectId(userId),
    type: "archive_request",
    clientId: new mongoose.Types.ObjectId(clientId),
    message: "Archive request",
    read,
    metadata: { companyName: "Test Company" },
  });
  return doc as unknown as INotification;
};

export const createTestEvent = async (createdBy: string, overrides: Record<string, unknown> = {}) =>
  EventModel.create({
    title: "Test Meeting",
    startDate: new Date("2026-06-15T10:00:00Z"),
    duration: 60,
    allDay: false,
    location: "Office",
    description: null,
    type: "team_meeting",
    clientId: null,
    createdBy,
    mandatory: false,
    ...overrides,
  });
