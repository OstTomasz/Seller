import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../models/User";
import Position from "../models/Position";
import Region from "../models/Region";
import Client from "../models/Client";
import Counter from "../models/Counter";
import Event from "../models/Event";
import Invitation from "../models/Invitation";
import { IUser, UserGrade, UserRole } from "../types";

// ── HELPERS ───────────────────────────────────────────────────────────────────

const generateNip = () => Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");

const generatePostalCode = () =>
  `${Math.floor(10 + Math.random() * 90)}-${Math.floor(100 + Math.random() * 900)}`;

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

// ── DATA ──────────────────────────────────────────────────────────────────────

const NORTH_CITIES = {
  POM: ["Gdańsk", "Gdynia", "Sopot", "Słupsk"],
  WAR: ["Olsztyn", "Elbląg", "Ełk", "Ostróda"],
};

const SOUTH_CITIES = {
  MAL: ["Kraków", "Nowy Sącz", "Tarnów", "Zakopane"],
  SLA: ["Katowice", "Gliwice", "Zabrze", "Bytom"],
};

// 2 superregions × 2 regions × 2 salespersons × 3 active + 1 archived = 16 active + 8 archived
const COMPANIES = {
  POM: {
    sp1: ["Acme Corp", "Globex Industries", "Initech Solutions"],
    sp2: ["Umbrella Ltd", "Wayne Enterprises", "Stark Industries"],
  },
  WAR: {
    sp1: ["Cyberdyne Systems", "Oscorp Technologies", "Soylent Corp"],
    sp2: ["Massive Dynamic", "Weyland-Yutani", "Virtucon Group"],
  },
  MAL: {
    sp1: ["Omni Consumer Products", "Buy N Large", "Rekall Inc"],
    sp2: ["Tyrell Corporation", "Nakatomi Trading", "Wonka Industries"],
  },
  SLA: {
    sp1: ["Dunder Mifflin", "Bluth Company", "Los Pollos Hermanos"],
    sp2: ["Prestige Worldwide", "Vandelay Industries", "Kramerica"],
  },
};

const ARCHIVED_COMPANIES = {
  POM: { sp1: "Sterling Cooper (Archived)", sp2: "Pied Piper (Archived)" },
  WAR: { sp1: "Hooli Corp (Archived)", sp2: "Aviato Systems (Archived)" },
  MAL: { sp1: "Gekko & Co (Archived)", sp2: "Initech Advanced (Archived)" },
  SLA: { sp1: "Veridian Dynamics (Archived)", sp2: "Reynholm Industries (Archived)" },
};

// ── SEED ──────────────────────────────────────────────────────────────────────

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);

  await User.deleteMany({});
  await Position.deleteMany({});
  await Region.deleteMany({});
  await Client.deleteMany({});
  await Counter.deleteMany({});
  await Event.deleteMany({});
  await Invitation.deleteMany({});
  console.log("Database cleared");

  // ── REGIONS ──────────────────────────────────────────────────────────────

  const superNorth = await Region.create({
    name: "Poland North",
    prefix: "PLN",
    parentRegion: null,
    deputy: null,
  });
  const superSouth = await Region.create({
    name: "Poland South",
    prefix: "PLS",
    parentRegion: null,
    deputy: null,
  });

  const regionPOM = await Region.create({
    name: "Pomeranian",
    prefix: "POM",
    parentRegion: superNorth._id,
    deputy: null,
  });
  const regionWAR = await Region.create({
    name: "Warmian-Masurian",
    prefix: "WAR",
    parentRegion: superNorth._id,
    deputy: null,
  });
  const regionMAL = await Region.create({
    name: "Lesser Poland",
    prefix: "MAL",
    parentRegion: superSouth._id,
    deputy: null,
  });
  const regionSLA = await Region.create({
    name: "Silesian",
    prefix: "SLA",
    parentRegion: superSouth._id,
    deputy: null,
  });

  console.log("Regions created");

  // ── POSITIONS ─────────────────────────────────────────────────────────────

  const directorPos = await Position.create({
    code: "DIR-1",
    region: null,
    type: "director",
    currentHolder: null,
  });
  const deputy1Pos = await Position.create({
    code: "DEP-PLN-1",
    region: superNorth._id,
    type: "deputy",
    currentHolder: null,
  });
  const deputy2Pos = await Position.create({
    code: "DEP-PLS-1",
    region: superSouth._id,
    type: "deputy",
    currentHolder: null,
  });

  const advPOMPos = await Position.create({
    code: "ADV-POM-1",
    region: regionPOM._id,
    type: "advisor",
    currentHolder: null,
  });
  const advWARPos = await Position.create({
    code: "ADV-WAR-1",
    region: regionWAR._id,
    type: "advisor",
    currentHolder: null,
  });
  const advMALPos = await Position.create({
    code: "ADV-MAL-1",
    region: regionMAL._id,
    type: "advisor",
    currentHolder: null,
  });
  const advSLAPos = await Position.create({
    code: "ADV-SLA-1",
    region: regionSLA._id,
    type: "advisor",
    currentHolder: null,
  });

  const [sp1POMPos, sp2POMPos] = await Position.insertMany([
    { code: "SP-POM-1", region: regionPOM._id, type: "salesperson", currentHolder: null },
    { code: "SP-POM-2", region: regionPOM._id, type: "salesperson", currentHolder: null },
  ]);
  const [sp1WARPos, sp2WARPos] = await Position.insertMany([
    { code: "SP-WAR-1", region: regionWAR._id, type: "salesperson", currentHolder: null },
    { code: "SP-WAR-2", region: regionWAR._id, type: "salesperson", currentHolder: null },
  ]);
  const [sp1MALPos, sp2MALPos] = await Position.insertMany([
    { code: "SP-MAL-1", region: regionMAL._id, type: "salesperson", currentHolder: null },
    { code: "SP-MAL-2", region: regionMAL._id, type: "salesperson", currentHolder: null },
  ]);
  const [sp1SLAPos, sp2SLAPos] = await Position.insertMany([
    { code: "SP-SLA-1", region: regionSLA._id, type: "salesperson", currentHolder: null },
    { code: "SP-SLA-2", region: regionSLA._id, type: "salesperson", currentHolder: null },
  ]);

  console.log("Positions created");

  // ── USERS ─────────────────────────────────────────────────────────────────

  const director = await User.create({
    firstName: "John",
    lastName: "Director",
    email: "director@seller.com",
    password: "password123",
    role: "director",
    grade: null,
    position: directorPos._id,
    mustChangePassword: false,
    isActive: true,
    createdBy: null,
    phone: "+48 500 000 001",
  });

  const deputy1 = await User.create({
    firstName: "Mary",
    lastName: "North",
    email: "deputy1@seller.com",
    password: "password123",
    role: "deputy",
    grade: null,
    position: deputy1Pos._id,
    mustChangePassword: false,
    isActive: true,
    createdBy: director._id,
    phone: "+48 500 000 001",
  });
  const deputy2 = await User.create({
    firstName: "Thomas",
    lastName: "South",
    email: "deputy2@seller.com",
    password: "password123",
    role: "deputy",
    grade: null,
    position: deputy2Pos._id,
    mustChangePassword: false,
    isActive: true,
    createdBy: director._id,
    phone: "+48 500 000 003",
  });

  const createUser = async (
    firstName: string,
    lastName: string,
    email: string,
    role: UserRole,
    grade: UserGrade | null,
    positionId: mongoose.Types.ObjectId,
    createdBy: mongoose.Types.ObjectId,
    phone: string,
  ): Promise<IUser> =>
    User.create({
      firstName,
      lastName,
      email,
      phone,
      password: "password123",
      role,
      grade,
      position: positionId,
      mustChangePassword: true,
      isActive: true,
      createdBy,
    });

  const advPOM = await createUser(
    "Peter",
    "Advisor",
    "adv.pom@seller.com",
    "advisor",
    3,
    advPOMPos._id,
    deputy1._id,
    "+48 600 100 001",
  );
  const advWAR = await createUser(
    "Anne",
    "Advisor",
    "adv.war@seller.com",
    "advisor",
    2,
    advWARPos._id,
    deputy1._id,
    "+48 600 100 002",
  );
  const advMAL = await createUser(
    "Sofia",
    "Advisor",
    "adv.mal@seller.com",
    "advisor",
    4,
    advMALPos._id,
    deputy2._id,
    "+48 600 100 003",
  );
  const advSLA = await createUser(
    "Mark",
    "Advisor",
    "adv.sla@seller.com",
    "advisor",
    3,
    advSLAPos._id,
    deputy2._id,
    "+48 600 100 004",
  );

  const sp1POM = await createUser(
    "Adam",
    "Smith",
    "sp1.pom@seller.com",
    "salesperson",
    2,
    sp1POMPos._id,
    advPOM._id,
    "+48 600 200 001",
  );
  const sp2POM = await createUser(
    "Beatrice",
    "Nowak",
    "sp2.pom@seller.com",
    "salesperson",
    1,
    sp2POMPos._id,
    advPOM._id,
    "+48 600 200 002",
  );
  const sp1WAR = await createUser(
    "Charles",
    "Brown",
    "sp1.war@seller.com",
    "salesperson",
    1,
    sp1WARPos._id,
    advWAR._id,
    "+48 600 200 003",
  );
  const sp2WAR = await createUser(
    "Diana",
    "Green",
    "sp2.war@seller.com",
    "salesperson",
    2,
    sp2WARPos._id,
    advWAR._id,
    "+48 600 200 004",
  );
  const sp1MAL = await createUser(
    "Edward",
    "White",
    "sp1.mal@seller.com",
    "salesperson",
    2,
    sp1MALPos._id,
    advMAL._id,
    "+48 600 200 005",
  );
  const sp2MAL = await createUser(
    "Fiona",
    "Black",
    "sp2.mal@seller.com",
    "salesperson",
    1,
    sp2MALPos._id,
    advMAL._id,
    "+48 600 200 006",
  );
  const sp1SLA = await createUser(
    "George",
    "Wilson",
    "sp1.sla@seller.com",
    "salesperson",
    3,
    sp1SLAPos._id,
    advSLA._id,
    "+48 600 200 007",
  );
  const sp2SLA = await createUser(
    "Hannah",
    "Taylor",
    "sp2.sla@seller.com",
    "salesperson",
    2,
    sp2SLAPos._id,
    advSLA._id,
    "+48 600 200 008",
  );

  console.log("Users created");

  // ── LINK POSITIONS ────────────────────────────────────────────────────────

  await Promise.all([
    Position.updateOne({ _id: directorPos._id }, { currentHolder: director._id }),
    Position.updateOne({ _id: deputy1Pos._id }, { currentHolder: deputy1._id }),
    Position.updateOne({ _id: deputy2Pos._id }, { currentHolder: deputy2._id }),
    Position.updateOne({ _id: advPOMPos._id }, { currentHolder: advPOM._id }),
    Position.updateOne({ _id: advWARPos._id }, { currentHolder: advWAR._id }),
    Position.updateOne({ _id: advMALPos._id }, { currentHolder: advMAL._id }),
    Position.updateOne({ _id: advSLAPos._id }, { currentHolder: advSLA._id }),
    Position.updateOne({ _id: sp1POMPos._id }, { currentHolder: sp1POM._id }),
    Position.updateOne({ _id: sp2POMPos._id }, { currentHolder: sp2POM._id }),
    Position.updateOne({ _id: sp1WARPos._id }, { currentHolder: sp1WAR._id }),
    Position.updateOne({ _id: sp2WARPos._id }, { currentHolder: sp2WAR._id }),
    Position.updateOne({ _id: sp1MALPos._id }, { currentHolder: sp1MAL._id }),
    Position.updateOne({ _id: sp2MALPos._id }, { currentHolder: sp2MAL._id }),
    Position.updateOne({ _id: sp1SLAPos._id }, { currentHolder: sp1SLA._id }),
    Position.updateOne({ _id: sp2SLAPos._id }, { currentHolder: sp2SLA._id }),
    Region.updateOne({ _id: superNorth._id }, { deputy: deputy1Pos._id }),
    Region.updateOne({ _id: superSouth._id }, { deputy: deputy2Pos._id }),
  ]);

  console.log("Relations linked");

  // ── CLIENTS ───────────────────────────────────────────────────────────────

  interface ClientSeed {
    companyName: string;
    nip: string;
    assignedTo: mongoose.Types.ObjectId;
    assignedAdvisor: mongoose.Types.ObjectId;
    status: string;
    lastActivityAt: Date;
    inactivityReason: string | null;
    archiveRequest: { requestedAt: Date | null; requestedBy: null; reason: string | null };
    notes: { content: string; createdBy: mongoose.Types.ObjectId }[];
    addresses: object[];
    contacts: never[];
  }

  const buildClient = (
    companyName: string,
    spPosId: mongoose.Types.ObjectId,
    advPosId: mongoose.Types.ObjectId,
    city: string,
    noteAuthorId: mongoose.Types.ObjectId,
    status: "active" | "inactive" | "reminder" = "active",
  ): ClientSeed => ({
    companyName,
    nip: generateNip(),
    assignedTo: spPosId,
    assignedAdvisor: advPosId,
    status,
    lastActivityAt: daysAgo(Math.floor(Math.random() * 60 + 5)),
    inactivityReason: status === "inactive" ? "No response for 90 days" : null,
    archiveRequest: { requestedAt: null, requestedBy: null, reason: null },
    notes: [
      { content: `Initial contact established. Follow up required.`, createdBy: noteAuthorId },
    ],
    addresses: [
      {
        label: "HQ",
        street: `Business St. ${Math.floor(Math.random() * 99 + 1)}`,
        city,
        postalCode: generatePostalCode(),
        contacts: [
          {
            firstName: "John",
            lastName: "Contact",
            phone: `+48 ${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`,
            email: `contact@${companyName.toLowerCase().replace(/[\s&(),.']/g, "")}.com`,
          },
        ],
      },
    ],
    contacts: [],
  });

  const buildArchivedClient = (
    companyName: string,
    spPosId: mongoose.Types.ObjectId,
    advPosId: mongoose.Types.ObjectId,
    city: string,
    noteAuthorId: mongoose.Types.ObjectId,
    directorId: mongoose.Types.ObjectId,
  ): ClientSeed => ({
    ...buildClient(companyName, spPosId, advPosId, city, noteAuthorId, "active"),
    status: "archived",
    archiveRequest: {
      requestedAt: daysAgo(30),
      requestedBy: null,
      reason: "Client terminated the contract",
    },
    notes: [
      { content: "Client onboarded successfully.", createdBy: noteAuthorId },
      { content: "Contract terminated. Archived by director.", createdBy: directorId },
    ],
  });

  // Active clients — 3 per salesperson
  const [c1sp1POM, c2sp1POM, c3sp1POM] = await Promise.all(
    COMPANIES.POM.sp1.map((name, i) =>
      Client.create(
        buildClient(
          name,
          sp1POMPos._id,
          advPOMPos._id,
          NORTH_CITIES.POM[i],
          sp1POM._id,
          i === 1 ? "inactive" : i === 2 ? "reminder" : "active",
        ),
      ),
    ),
  );
  const [c1sp2POM, c2sp2POM, c3sp2POM] = await Promise.all(
    COMPANIES.POM.sp2.map((name, i) =>
      Client.create(
        buildClient(
          name,
          sp2POMPos._id,
          advPOMPos._id,
          NORTH_CITIES.POM[i],
          sp2POM._id,
          i === 2 ? "inactive" : "active",
        ),
      ),
    ),
  );

  const [c1sp1WAR, c2sp1WAR, c3sp1WAR] = await Promise.all(
    COMPANIES.WAR.sp1.map((name, i) =>
      Client.create(
        buildClient(
          name,
          sp1WARPos._id,
          advWARPos._id,
          NORTH_CITIES.WAR[i],
          sp1WAR._id,
          i === 1 ? "reminder" : "active",
        ),
      ),
    ),
  );
  const [c1sp2WAR, c2sp2WAR, c3sp2WAR] = await Promise.all(
    COMPANIES.WAR.sp2.map((name, i) =>
      Client.create(
        buildClient(name, sp2WARPos._id, advWARPos._id, NORTH_CITIES.WAR[i], sp2WAR._id, "active"),
      ),
    ),
  );

  const [c1sp1MAL, c2sp1MAL, c3sp1MAL] = await Promise.all(
    COMPANIES.MAL.sp1.map((name, i) =>
      Client.create(
        buildClient(
          name,
          sp1MALPos._id,
          advMALPos._id,
          SOUTH_CITIES.MAL[i],
          sp1MAL._id,
          i === 2 ? "inactive" : "active",
        ),
      ),
    ),
  );
  const [c1sp2MAL, c2sp2MAL, c3sp2MAL] = await Promise.all(
    COMPANIES.MAL.sp2.map((name, i) =>
      Client.create(
        buildClient(name, sp2MALPos._id, advMALPos._id, SOUTH_CITIES.MAL[i], sp2MAL._id, "active"),
      ),
    ),
  );

  const [c1sp1SLA, c2sp1SLA, c3sp1SLA] = await Promise.all(
    COMPANIES.SLA.sp1.map((name, i) =>
      Client.create(
        buildClient(
          name,
          sp1SLAPos._id,
          advSLAPos._id,
          SOUTH_CITIES.SLA[i],
          sp1SLA._id,
          i === 1 ? "reminder" : "active",
        ),
      ),
    ),
  );
  const [c1sp2SLA, c2sp2SLA, c3sp2SLA] = await Promise.all(
    COMPANIES.SLA.sp2.map((name, i) =>
      Client.create(
        buildClient(name, sp2SLAPos._id, advSLAPos._id, SOUTH_CITIES.SLA[i], sp2SLA._id, "active"),
      ),
    ),
  );

  // Archived clients — 1 per salesperson
  await Promise.all([
    Client.create(
      buildArchivedClient(
        ARCHIVED_COMPANIES.POM.sp1,
        sp1POMPos._id,
        advPOMPos._id,
        "Gdańsk",
        sp1POM._id,
        director._id,
      ),
    ),
    Client.create(
      buildArchivedClient(
        ARCHIVED_COMPANIES.POM.sp2,
        sp2POMPos._id,
        advPOMPos._id,
        "Gdynia",
        sp2POM._id,
        director._id,
      ),
    ),
    Client.create(
      buildArchivedClient(
        ARCHIVED_COMPANIES.WAR.sp1,
        sp1WARPos._id,
        advWARPos._id,
        "Olsztyn",
        sp1WAR._id,
        director._id,
      ),
    ),
    Client.create(
      buildArchivedClient(
        ARCHIVED_COMPANIES.WAR.sp2,
        sp2WARPos._id,
        advWARPos._id,
        "Elbląg",
        sp2WAR._id,
        director._id,
      ),
    ),
    Client.create(
      buildArchivedClient(
        ARCHIVED_COMPANIES.MAL.sp1,
        sp1MALPos._id,
        advMALPos._id,
        "Kraków",
        sp1MAL._id,
        director._id,
      ),
    ),
    Client.create(
      buildArchivedClient(
        ARCHIVED_COMPANIES.MAL.sp2,
        sp2MALPos._id,
        advMALPos._id,
        "Tarnów",
        sp2MAL._id,
        director._id,
      ),
    ),
    Client.create(
      buildArchivedClient(
        ARCHIVED_COMPANIES.SLA.sp1,
        sp1SLAPos._id,
        advSLAPos._id,
        "Katowice",
        sp1SLA._id,
        director._id,
      ),
    ),
    Client.create(
      buildArchivedClient(
        ARCHIVED_COMPANIES.SLA.sp2,
        sp2SLAPos._id,
        advSLAPos._id,
        "Gliwice",
        sp2SLA._id,
        director._id,
      ),
    ),
  ]);

  console.log("Clients created");

  // ── EVENTS & INVITATIONS ─────────────────────────────────────────────────

  const addMeetingNote = async (
    clientId: mongoose.Types.ObjectId,
    creatorId: mongoose.Types.ObjectId,
    eventDate: Date,
    title: string,
    location: string | null,
    duration: number,
    inviteeNames: string[] = [],
  ) => {
    const dateStr = eventDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const timeStr = eventDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const lines = [
      `📅 Client meeting: ${title}`,
      `Date: ${dateStr}`,
      `Time: ${timeStr}`,
      `Duration: ${duration} min`,
    ];
    if (location) lines.push(`Location: ${location}`);
    if (inviteeNames.length) lines.push(`Participants: ${inviteeNames.join(", ")}`);

    await Client.updateOne(
      { _id: clientId },
      {
        $push: { notes: { content: lines.join("\n"), createdBy: creatorId } },
        lastActivityAt: new Date(),
      },
    );
  };

  const createEventWithInvitees = async (
    title: string,
    startDate: Date,
    duration: number,
    type: "client_meeting" | "team_meeting" | "personal",
    creatorId: mongoose.Types.ObjectId,
    inviteeIds: mongoose.Types.ObjectId[],
    options: {
      clientId?: mongoose.Types.ObjectId;
      location?: string;
      description?: string;
      mandatory?: boolean;
    } = {},
  ) => {
    const event = await Event.create({
      title,
      startDate,
      duration,
      allDay: false,
      location: options.location ?? null,
      description: options.description ?? null,
      type,
      clientId: options.clientId ?? null,
      createdBy: creatorId,
      mandatory: options.mandatory ?? false,
    });

    if (inviteeIds.length) {
      await Invitation.insertMany(
        inviteeIds.map((inviteeId) => ({ eventId: event._id, inviteeId, status: "accepted" })),
      );
    }

    return event;
  };

  // sp1POM — solo client meeting with Acme Corp (past)
  const ev1Date = daysAgo(10);
  ev1Date.setHours(10, 0, 0, 0);
  await createEventWithInvitees(
    "Quarterly review — Acme Corp",
    ev1Date,
    60,
    "client_meeting",
    sp1POM._id,
    [],
    { clientId: c1sp1POM._id, location: "Gdańsk office" },
  );
  await addMeetingNote(
    c1sp1POM._id,
    sp1POM._id,
    ev1Date,
    "Quarterly review — Acme Corp",
    "Gdańsk office",
    60,
  );

  // sp2POM — solo client meeting with Umbrella Ltd (upcoming)
  const ev2Date = daysFromNow(5);
  ev2Date.setHours(14, 0, 0, 0);
  await createEventWithInvitees(
    "Contract negotiation — Umbrella Ltd",
    ev2Date,
    90,
    "client_meeting",
    sp2POM._id,
    [],
    { clientId: c1sp2POM._id, location: "Client HQ" },
  );
  await addMeetingNote(
    c1sp2POM._id,
    sp2POM._id,
    ev2Date,
    "Contract negotiation — Umbrella Ltd",
    "Client HQ",
    90,
  );

  // advPOM + sp1POM — joint client meeting with Globex Industries (past)
  const ev3Date = daysAgo(5);
  ev3Date.setHours(11, 0, 0, 0);
  await createEventWithInvitees(
    "Strategy session — Globex Industries",
    ev3Date,
    120,
    "client_meeting",
    advPOM._id,
    [sp1POM._id],
    {
      clientId: c2sp1POM._id,
      location: "Sopot conference room",
      description: "Annual strategy alignment",
    },
  );
  await addMeetingNote(
    c2sp1POM._id,
    advPOM._id,
    ev3Date,
    "Strategy session — Globex Industries",
    "Sopot conference room",
    120,
    ["Adam Smith"],
  );

  // advPOM + sp2POM — joint client meeting with Wayne Enterprises (upcoming)
  const ev4Date = daysFromNow(8);
  ev4Date.setHours(9, 0, 0, 0);
  await createEventWithInvitees(
    "Onboarding review — Wayne Enterprises",
    ev4Date,
    90,
    "client_meeting",
    advPOM._id,
    [sp2POM._id],
    { clientId: c2sp2POM._id, location: "Gdańsk office" },
  );
  await addMeetingNote(
    c2sp2POM._id,
    advPOM._id,
    ev4Date,
    "Onboarding review — Wayne Enterprises",
    "Gdańsk office",
    90,
    ["Beatrice Nowak"],
  );

  // advPOM + sp1POM + sp2POM — joint client meeting with Initech Solutions (upcoming)
  const ev5Date = daysFromNow(14);
  ev5Date.setHours(13, 0, 0, 0);
  await createEventWithInvitees(
    "Regional review — Initech Solutions",
    ev5Date,
    60,
    "client_meeting",
    advPOM._id,
    [sp1POM._id, sp2POM._id],
    { clientId: c3sp1POM._id, location: "Gdynia office" },
  );
  await addMeetingNote(
    c3sp1POM._id,
    advPOM._id,
    ev5Date,
    "Regional review — Initech Solutions",
    "Gdynia office",
    60,
    ["Adam Smith", "Beatrice Nowak"],
  );

  // sp1WAR — solo client meeting (past)
  const ev6Date = daysAgo(7);
  ev6Date.setHours(9, 0, 0, 0);
  await createEventWithInvitees(
    "Initial meeting — Cyberdyne Systems",
    ev6Date,
    60,
    "client_meeting",
    sp1WAR._id,
    [],
    { clientId: c1sp1WAR._id, location: "Olsztyn office" },
  );
  await addMeetingNote(
    c1sp1WAR._id,
    sp1WAR._id,
    ev6Date,
    "Initial meeting — Cyberdyne Systems",
    "Olsztyn office",
    60,
  );

  // sp1MAL — solo client meeting (upcoming)
  const ev7Date = daysFromNow(3);
  ev7Date.setHours(15, 0, 0, 0);
  await createEventWithInvitees(
    "Product demo — Omni Consumer Products",
    ev7Date,
    45,
    "client_meeting",
    sp1MAL._id,
    [],
    { clientId: c1sp1MAL._id, location: "Kraków showroom" },
  );
  await addMeetingNote(
    c1sp1MAL._id,
    sp1MAL._id,
    ev7Date,
    "Product demo — Omni Consumer Products",
    "Kraków showroom",
    45,
  );

  // advMAL + sp1MAL — joint client meeting (upcoming)
  const ev8Date = daysFromNow(10);
  ev8Date.setHours(10, 0, 0, 0);
  await createEventWithInvitees(
    "Renewal discussion — Buy N Large",
    ev8Date,
    90,
    "client_meeting",
    advMAL._id,
    [sp1MAL._id],
    { clientId: c2sp1MAL._id, location: "Tarnów office" },
  );
  await addMeetingNote(
    c2sp1MAL._id,
    advMAL._id,
    ev8Date,
    "Renewal discussion — Buy N Large",
    "Tarnów office",
    90,
    ["Edward White"],
  );

  // sp1SLA — solo client meeting (past)
  const ev9Date = daysAgo(3);
  ev9Date.setHours(11, 0, 0, 0);
  await createEventWithInvitees(
    "Follow-up — Dunder Mifflin",
    ev9Date,
    60,
    "client_meeting",
    sp1SLA._id,
    [],
    { clientId: c1sp1SLA._id, location: "Katowice office" },
  );
  await addMeetingNote(
    c1sp1SLA._id,
    sp1SLA._id,
    ev9Date,
    "Follow-up — Dunder Mifflin",
    "Katowice office",
    60,
  );

  // deputy1 — team meeting for Poland North (upcoming, mandatory)
  const ev10Date = daysFromNow(7);
  ev10Date.setHours(9, 0, 0, 0);
  await createEventWithInvitees(
    "North region quarterly briefing",
    ev10Date,
    120,
    "team_meeting",
    deputy1._id,
    [advPOM._id, advWAR._id, sp1POM._id, sp2POM._id, sp1WAR._id, sp2WAR._id],
    { location: "Online — Teams", description: "Q2 results and Q3 targets", mandatory: true },
  );

  // director — company-wide team meeting (upcoming, mandatory)
  const ev11Date = daysFromNow(21);
  ev11Date.setHours(10, 0, 0, 0);
  await createEventWithInvitees(
    "Annual company kickoff",
    ev11Date,
    180,
    "team_meeting",
    director._id,
    [
      deputy1._id,
      deputy2._id,
      advPOM._id,
      advWAR._id,
      advMAL._id,
      advSLA._id,
      sp1POM._id,
      sp2POM._id,
      sp1WAR._id,
      sp2WAR._id,
      sp1MAL._id,
      sp2MAL._id,
      sp1SLA._id,
      sp2SLA._id,
    ],
    { location: "Warsaw HQ", description: "Full company strategy day", mandatory: true },
  );

  // sp1POM — personal event
  const ev12Date = daysFromNow(2);
  ev12Date.setHours(8, 0, 0, 0);
  await createEventWithInvitees("Report preparation", ev12Date, 60, "personal", sp1POM._id, [], {});

  // advSLA + sp1SLA + sp2SLA — joint client meeting (upcoming)
  const ev13Date = daysFromNow(12);
  ev13Date.setHours(14, 0, 0, 0);
  await createEventWithInvitees(
    "Account review — Prestige Worldwide",
    ev13Date,
    90,
    "client_meeting",
    advSLA._id,
    [sp1SLA._id, sp2SLA._id],
    { clientId: c1sp2SLA._id, location: "Zabrze office" },
  );
  await addMeetingNote(
    c1sp2SLA._id,
    advSLA._id,
    ev13Date,
    "Account review — Prestige Worldwide",
    "Zabrze office",
    90,
    ["George Wilson", "Hannah Taylor"],
  );

  console.log("Events and invitations created");

  // ── SUMMARY ───────────────────────────────────────────────────────────────

  console.log("\n=== Seed completed ===");
  console.log("director@seller.com     / password123");
  console.log("--- Poland North (deputy1) ---");
  console.log("deputy1@seller.com      / password123");
  console.log("  adv.pom@seller.com    / password123  (POM advisor)");
  console.log("  sp1.pom@seller.com    / password123  (3 active + 1 archived)");
  console.log("  sp2.pom@seller.com    / password123  (3 active + 1 archived)");
  console.log("  adv.war@seller.com    / password123  (WAR advisor)");
  console.log("  sp1.war@seller.com    / password123  (3 active + 1 archived)");
  console.log("  sp2.war@seller.com    / password123  (3 active + 1 archived)");
  console.log("--- Poland South (deputy2) ---");
  console.log("deputy2@seller.com      / password123");
  console.log("  adv.mal@seller.com    / password123  (MAL advisor)");
  console.log("  sp1.mal@seller.com    / password123  (3 active + 1 archived)");
  console.log("  sp2.mal@seller.com    / password123  (3 active + 1 archived)");
  console.log("  adv.sla@seller.com    / password123  (SLA advisor)");
  console.log("  sp1.sla@seller.com    / password123  (3 active + 1 archived)");
  console.log("  sp2.sla@seller.com    / password123  (3 active + 1 archived)");

  await mongoose.connection.close();
};

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
