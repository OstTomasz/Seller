import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../models/User";
import Position from "../models/Position";
import Region from "../models/Region";
import Client from "../models/Client";
import Counter from "../models/Counter";
import { IUser, UserGrade, UserRole } from "../types";

// ── CLIENT DATA ───────────────────────────────────────────────────────────────

const COMPANY_NAMES = [
  "Acme Corp", "Globex Industries", "Initech Solutions", "Umbrella Ltd",
  "Wayne Enterprises", "Stark Industries", "Cyberdyne Systems", "Oscorp Technologies",
  "Soylent Corp", "Massive Dynamic", "Weyland-Yutani", "Virtucon Group",
  "Omni Consumer Products", "Buy N Large", "Rekall Inc", "Tyrell Corporation",
  "Nakatomi Trading", "Wonka Industries", "Dunder Mifflin", "Bluth Company",
  "Los Pollos Hermanos", "Prestige Worldwide", "Vandelay Industries", "Kramerica",
  "Sterling Cooper", "Pied Piper", "Hooli Corp", "Aviato Systems",
  "Dinesh & Gilfoyle", "Endframe Technologies", "Umbrella Research", "Gekko & Co",
  "Initech Advanced", "Massive Dynamics", "Veridian Dynamics", "Reynholm Industries",
  "Pendant Publishing", "Dharma Initiative", "Oceanic Airlines", "Aperture Science",
  "Black Mesa", "Vault-Tec Corp", "Robco Industries", "General Atomics",
  "Nuka-Cola Corp", "Spacely Sprockets", "Cogswell Cogs", "Jetson Industries",
  "Planet Express", "Mom's Friendly Robot", "MomCorp", "Suicide Squad Inc",
  "Wolfram & Hart", "Sunnydale Corp", "Initiative Labs", "Weyland Corp",
  "Yoyodyne Propulsion", "Acme Advanced", "Globex Prime", "Initech Global",
];

const CITIES: Record<string, string[]> = {
  POM: ["Gdańsk", "Gdynia", "Sopot", "Słupsk", "Wejherowo", "Tczew"],
  WAR: ["Olsztyn", "Elbląg", "Ełk", "Ostróda", "Giżycko", "Kętrzyn"],
  MAL: ["Kraków", "Nowy Sącz", "Tarnów", "Zakopane", "Oświęcim", "Chrzanów"],
  SLA: ["Katowice", "Gliwice", "Zabrze", "Bytom", "Sosnowiec", "Rybnik"],
};

const STATUSES = ["active", "active", "active", "reminder", "inactive"] as const;

const generateNip = () =>
  Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");

const generatePostalCode = () =>
  `${Math.floor(10 + Math.random() * 90)}-${Math.floor(100 + Math.random() * 900)}`;

const generateClients = (
  salespersonPositionId: mongoose.Types.ObjectId,
  advisorPositionId: mongoose.Types.ObjectId,
  cities: string[],
  companyNames: string[],
) =>
  Array.from({ length: 5 }, (_, i) => ({
    companyName: companyNames[i],
    nip: generateNip(),
    assignedTo: salespersonPositionId,
    assignedAdvisor: advisorPositionId,
    status: STATUSES[i % STATUSES.length],
    lastActivityAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 90),
    inactivityReason: STATUSES[i % STATUSES.length] === "inactive"
      ? "No response for 3 months"
      : null,
    archiveRequest: { requestedAt: null, requestedBy: null, reason: null },
    notes: i % 2 === 0 ? "Key account — contact before end of quarter" : null,
    addresses: [{
      label: "HQ",
      street: `ul. Testowa ${i + 1}`,
      city: cities[i % cities.length],
      postalCode: generatePostalCode(),
      contacts: [{
        firstName: "John",
        lastName: "Smith",
        phone: `+48 ${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`,
        email: `contact@${companyNames[i].toLowerCase().replace(/[\s&]/g, "")}.com`,
      }],
    }],
    contacts: [],
  }));

// ── SEED ─────────────────────────────────────────────────────────────────────

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);

  // ── CLEANUP ──────────────────────────────────────────────
  await User.deleteMany({});
  await Position.deleteMany({});
  await Region.deleteMany({});
  await Client.deleteMany({});
  await Counter.deleteMany({});
  console.log("Database cleared");

  // ── REGIONS ──────────────────────────────────────────────

  const superNorth = await Region.create({ name: "Poland North", prefix: "PLN", parentRegion: null, deputy: null });
  const superSouth = await Region.create({ name: "Poland South", prefix: "PLS", parentRegion: null, deputy: null });

  const regionPOM = await Region.create({ name: "Pomorskie",           prefix: "POM", parentRegion: superNorth._id, deputy: null });
  const regionWAR = await Region.create({ name: "Warmińsko-Mazurskie", prefix: "WAR", parentRegion: superNorth._id, deputy: null });
  const regionMAL = await Region.create({ name: "Małopolskie",         prefix: "MAL", parentRegion: superSouth._id, deputy: null });
  const regionSLA = await Region.create({ name: "Śląskie",             prefix: "SLA", parentRegion: superSouth._id, deputy: null });

  console.log("Regions created");

  // ── POSITIONS ────────────────────────────────────────────

  const directorPos = await Position.create({ code: "DIR-1",     region: null,          type: "director",    currentHolder: null });
  const deputy1Pos  = await Position.create({ code: "DEP-PLN-1", region: superNorth._id, type: "deputy",      currentHolder: null });
  const deputy2Pos  = await Position.create({ code: "DEP-PLS-1", region: superSouth._id, type: "deputy",      currentHolder: null });

  const advPOMPos = await Position.create({ code: "ADV-POM-1", region: regionPOM._id, type: "advisor", currentHolder: null });
  const advWARPos = await Position.create({ code: "ADV-WAR-1", region: regionWAR._id, type: "advisor", currentHolder: null });
  const advMALPos = await Position.create({ code: "ADV-MAL-1", region: regionMAL._id, type: "advisor", currentHolder: null });
  const advSLAPos = await Position.create({ code: "ADV-SLA-1", region: regionSLA._id, type: "advisor", currentHolder: null });

  const spPosPOM = await Position.insertMany([
    { code: "SP-POM-1", region: regionPOM._id, type: "salesperson", currentHolder: null },
    { code: "SP-POM-2", region: regionPOM._id, type: "salesperson", currentHolder: null },
    { code: "SP-POM-3", region: regionPOM._id, type: "salesperson", currentHolder: null },
  ]);
  const spPosWAR = await Position.insertMany([
    { code: "SP-WAR-1", region: regionWAR._id, type: "salesperson", currentHolder: null },
    { code: "SP-WAR-2", region: regionWAR._id, type: "salesperson", currentHolder: null },
    { code: "SP-WAR-3", region: regionWAR._id, type: "salesperson", currentHolder: null },
  ]);
  const spPosMAL = await Position.insertMany([
    { code: "SP-MAL-1", region: regionMAL._id, type: "salesperson", currentHolder: null },
    { code: "SP-MAL-2", region: regionMAL._id, type: "salesperson", currentHolder: null },
    { code: "SP-MAL-3", region: regionMAL._id, type: "salesperson", currentHolder: null },
  ]);
  const spPosSLA = await Position.insertMany([
    { code: "SP-SLA-1", region: regionSLA._id, type: "salesperson", currentHolder: null },
    { code: "SP-SLA-2", region: regionSLA._id, type: "salesperson", currentHolder: null },
    { code: "SP-SLA-3", region: regionSLA._id, type: "salesperson", currentHolder: null },
  ]);

  console.log("Positions created");

  // ── USERS ────────────────────────────────────────────────

  const director = await User.create({
    firstName: "Jan", lastName: "Dyrektor", email: "director@seller.com",
    password: "password123", role: "director", grade: null,
    position: directorPos._id, mustChangePassword: false, isActive: true, createdBy: null,
  });

  const deputy1 = await User.create({
    firstName: "Maria", lastName: "Kowalska", email: "deputy1@seller.com",
    password: "password123", role: "deputy", grade: null,
    position: deputy1Pos._id, mustChangePassword: false, isActive: true, createdBy: director._id,
  });

  const deputy2 = await User.create({
    firstName: "Tomasz", lastName: "Wiśniewski", email: "deputy2@seller.com",
    password: "password123", role: "deputy", grade: null,
    position: deputy2Pos._id, mustChangePassword: false, isActive: true, createdBy: director._id,
  });

  // advisors
  const advPOM = await User.create({
    firstName: "Piotr", lastName: "Doradca", email: "advisor.pom@seller.com",
    password: "password123", role: "advisor", grade: 3,
    position: advPOMPos._id, mustChangePassword: true, isActive: true, createdBy: deputy1._id,
  });
  const advWAR = await User.create({
    firstName: "Anna", lastName: "Doradca", email: "advisor.war@seller.com",
    password: "password123", role: "advisor", grade: 2,
    position: advWARPos._id, mustChangePassword: true, isActive: true, createdBy: deputy1._id,
  });
  const advMAL = await User.create({
    firstName: "Zofia", lastName: "Doradca", email: "advisor.mal@seller.com",
    password: "password123", role: "advisor", grade: 4,
    position: advMALPos._id, mustChangePassword: true, isActive: true, createdBy: deputy2._id,
  });
  const advSLA = await User.create({
    firstName: "Marek", lastName: "Doradca", email: "advisor.sla@seller.com",
    password: "password123", role: "advisor", grade: 3,
    position: advSLAPos._id, mustChangePassword: true, isActive: true, createdBy: deputy2._id,
  });

  // salespersons helper
  const createSalespersons = async (
    data: { firstName: string; lastName: string; email: string; grade: UserGrade }[],
    positions: typeof spPosPOM,
    createdBy: IUser,
  ): Promise<IUser[]> => {
    const result: IUser[] = [];
    for (let i = 0; i < data.length; i++) {
      const sp = await User.create({
        ...data[i],
        password: "password123",
        role: "salesperson" as UserRole,
        position: positions[i]._id,
        mustChangePassword: true,
        isActive: true,
        createdBy: createdBy._id,
      });
      result.push(sp);
    }
    return result;
  };

  const spPOM = await createSalespersons([
    { firstName: "Adam",    lastName: "Kowalski",   email: "sp1.pom@seller.com", grade: 2 },
    { firstName: "Beata",   lastName: "Nowak",      email: "sp2.pom@seller.com", grade: 1 },
    { firstName: "Czesław", lastName: "Wójcik",     email: "sp3.pom@seller.com", grade: 3 },
  ], spPosPOM, advPOM);

  const spWAR = await createSalespersons([
    { firstName: "Dawid",   lastName: "Kamński",    email: "sp1.war@seller.com", grade: 1 },
    { firstName: "Ewa",     lastName: "Zielińska",  email: "sp2.war@seller.com", grade: 2 },
    { firstName: "Filip",   lastName: "Szymański",  email: "sp3.war@seller.com", grade: 3 },
  ], spPosWAR, advWAR);

  const spMAL = await createSalespersons([
    { firstName: "Grażyna", lastName: "Lewandowska",email: "sp1.mal@seller.com", grade: 2 },
    { firstName: "Henryk",  lastName: "Woźniak",    email: "sp2.mal@seller.com", grade: 1 },
    { firstName: "Irena",   lastName: "Dąbrowska",  email: "sp3.mal@seller.com", grade: 3 },
  ], spPosMAL, advMAL);

  const spSLA = await createSalespersons([
    { firstName: "Jacek",   lastName: "Kozłowski",  email: "sp1.sla@seller.com", grade: 3 },
    { firstName: "Kasia",   lastName: "Jankowska",  email: "sp2.sla@seller.com", grade: 2 },
    { firstName: "Leszek",  lastName: "Wojciechowski", email: "sp3.sla@seller.com", grade: 1 },
  ], spPosSLA, advSLA);

  console.log("Users created");

  // ── LINK POSITIONS → USERS ───────────────────────────────

  directorPos.currentHolder = director._id;
  await directorPos.save();

  deputy1Pos.currentHolder = deputy1._id;
  await deputy1Pos.save();

  deputy2Pos.currentHolder = deputy2._id;
  await deputy2Pos.save();

  advPOMPos.currentHolder = advPOM._id; await advPOMPos.save();
  advWARPos.currentHolder = advWAR._id; await advWARPos.save();
  advMALPos.currentHolder = advMAL._id; await advMALPos.save();
  advSLAPos.currentHolder = advSLA._id; await advSLAPos.save();

  const linkSalespersons = async (sps: IUser[], positions: typeof spPosPOM) => {
    for (let i = 0; i < 3; i++) {
      await Position.updateOne({ _id: positions[i]._id }, { currentHolder: sps[i]._id });
    }
  };

  await linkSalespersons(spPOM, spPosPOM);
  await linkSalespersons(spWAR, spPosWAR);
  await linkSalespersons(spMAL, spPosMAL);
  await linkSalespersons(spSLA, spPosSLA);

  superNorth.deputy = deputy1Pos._id; await superNorth.save();
  superSouth.deputy = deputy2Pos._id; await superSouth.save();

  console.log("Relations linked");

  // ── CLIENTS ──────────────────────────────────────────────

  const createClientsForRegion = async (
    salespersons: IUser[],
    spPositions: typeof spPosPOM,
    advisorPosition: typeof advPOMPos,
    prefix: string,
    companyNamesSlice: string[],
  ) => {
    for (let i = 0; i < 3; i++) {
      const companies = companyNamesSlice.slice(i * 5, i * 5 + 5);
      const docs = generateClients(
        spPositions[i]._id as mongoose.Types.ObjectId,
        advisorPosition._id as mongoose.Types.ObjectId,
        CITIES[prefix],
        companies,
      );
      for (const doc of docs) {
        await Client.create(doc);
      }
    }
  };

  // 60 company names split into 4 regions × 15
  await createClientsForRegion(spPOM, spPosPOM, advPOMPos, "POM", COMPANY_NAMES.slice(0,  15));
  await createClientsForRegion(spWAR, spPosWAR, advWARPos, "WAR", COMPANY_NAMES.slice(15, 30));
  await createClientsForRegion(spMAL, spPosMAL, advMALPos, "MAL", COMPANY_NAMES.slice(30, 45));
  await createClientsForRegion(spSLA, spPosSLA, advSLAPos, "SLA", COMPANY_NAMES.slice(45, 60));

  console.log("Clients created (60 total — 5 per salesperson)");

  // ── SUMMARY ──────────────────────────────────────────────

  console.log("\n=== Seed completed ===");
  console.log("director@seller.com   / password123");
  console.log("--- Poland North ---");
  console.log("deputy1@seller.com    / password123");
  console.log("  advisor.pom@seller.com / password123");
  console.log("  sp1.pom@seller.com  / password123  (5 clients)");
  console.log("  sp2.pom@seller.com  / password123  (5 clients)");
  console.log("  sp3.pom@seller.com  / password123  (5 clients)");
  console.log("  advisor.war@seller.com / password123");
  console.log("  sp1.war@seller.com  / password123  (5 clients)");
  console.log("  sp2.war@seller.com  / password123  (5 clients)");
  console.log("  sp3.war@seller.com  / password123  (5 clients)");
  console.log("--- Poland South ---");
  console.log("deputy2@seller.com    / password123");
  console.log("  advisor.mal@seller.com / password123");
  console.log("  sp1.mal@seller.com  / password123  (5 clients)");
  console.log("  sp2.mal@seller.com  / password123  (5 clients)");
  console.log("  sp3.mal@seller.com  / password123  (5 clients)");
  console.log("  advisor.sla@seller.com / password123");
  console.log("  sp1.sla@seller.com  / password123  (5 clients)");
  console.log("  sp2.sla@seller.com  / password123  (5 clients)");
  console.log("  sp3.sla@seller.com  / password123  (5 clients)");

  await mongoose.connection.close();
};

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });