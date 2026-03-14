import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../models/User";
import Position from "../models/Position";
import Region from "../models/Region";
import { IUser, UserGrade, UserRole } from "../types";

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);

  // ── CLEANUP ──────────────────────────────────────────────
  await User.deleteMany({});
  await Position.deleteMany({});
  await Region.deleteMany({});
  console.log("Database cleared");

  // ── REGIONS ──────────────────────────────────────────────

  const superRegion = await Region.create({
    name: "Poland",
    prefix: "PL",
    parentRegion: null,
    deputy: null,
  });

  const regionNorth = await Region.create({
    name: "Pomorskie",
    prefix: "POM",
    parentRegion: superRegion._id,
    deputy: null,
  });

  const regionSouth = await Region.create({
    name: "Małopolskie",
    prefix: "MAL",
    parentRegion: superRegion._id,
    deputy: null,
  });

  console.log("Regions created");

  // ── POSITIONS ────────────────────────────────────────────

  const directorPosition = await Position.create({
    code: "DIR-1",
    region: null,
    type: "director",
    currentHolder: null,
  });

  const deputyPosition = await Position.create({
    code: "DEP-PL-1",
    region: superRegion._id,
    type: "deputy",
    currentHolder: null,
  });

  // Pomorskie
  const advisorPositionNorth = await Position.create({
    code: "ADV-POM-1",
    region: regionNorth._id,
    type: "advisor",
    currentHolder: null,
  });

  const salespersonPositionsNorth = await Position.insertMany([
    { code: "SP-POM-1", region: regionNorth._id, type: "salesperson", currentHolder: null },
    { code: "SP-POM-2", region: regionNorth._id, type: "salesperson", currentHolder: null },
    { code: "SP-POM-3", region: regionNorth._id, type: "salesperson", currentHolder: null },
  ]);

  // Małopolskie
  const advisorPositionSouth = await Position.create({
    code: "ADV-MAL-1",
    region: regionSouth._id,
    type: "advisor",
    currentHolder: null,
  });

  const salespersonPositionsSouth = await Position.insertMany([
    { code: "SP-MAL-1", region: regionSouth._id, type: "salesperson", currentHolder: null },
    { code: "SP-MAL-2", region: regionSouth._id, type: "salesperson", currentHolder: null },
    { code: "SP-MAL-3", region: regionSouth._id, type: "salesperson", currentHolder: null },
  ]);

  console.log("Positions created");

  // ── USERS ────────────────────────────────────────────────

  const director = await User.create({
    firstName: "Jan",
    lastName: "Dyrektor",
    email: "director@seller.com",
    password: "password123",
    role: "director",
    grade: null,
    position: directorPosition._id,
    mustChangePassword: false,
    isActive: true,
    createdBy: null,
  });

  const deputy = await User.create({
    firstName: "Maria",
    lastName: "Zastępca",
    email: "deputy@seller.com",
    password: "password123",
    role: "deputy",
    grade: null,
    position: deputyPosition._id,
    mustChangePassword: false,
    isActive: true,
    createdBy: director._id,
  });

  // Pomorskie — advisor
  const advisorNorth = await User.create({
    firstName: "Piotr",
    lastName: "Doradca",
    email: "advisor.north@seller.com",
    password: "password123",
    role: "advisor",
    grade: 3,
    position: advisorPositionNorth._id,
    mustChangePassword: true,
    isActive: true,
    createdBy: director._id,
  });

  // Pomorskie — salespersons
// Pomorskie — salespersons
const salespersonsNorthData: { firstName: string; lastName: string; email: string; grade: UserGrade }[] = [
  { firstName: "Adam",    lastName: "Kowalski",   email: "sp1.north@seller.com", grade: 2 },
  { firstName: "Beata",   lastName: "Nowak",      email: "sp2.north@seller.com", grade: 1 },
  { firstName: "Czesław", lastName: "Wiśniewski", email: "sp3.north@seller.com", grade: 3 },
];

const salespersonsNorth: IUser[] = [];
for (let i = 0; i < salespersonsNorthData.length; i++) {
  const sp = await User.create({
    ...salespersonsNorthData[i],
    password: "password123",
    role: "salesperson" as UserRole,
    position: salespersonPositionsNorth[i]._id,
    mustChangePassword: true,
    isActive: true,
    createdBy: advisorNorth._id,
  });
  salespersonsNorth.push(sp);
}

  // Małopolskie — advisor
  const advisorSouth = await User.create({
    firstName: "Zofia",
    lastName: "Doradca",
    email: "advisor.south@seller.com",
    password: "password123",
    role: "advisor",
    grade: 4,
    position: advisorPositionSouth._id,
    mustChangePassword: true,
    isActive: true,
    createdBy: director._id,
  });

  // Małopolskie — salespersons
  const salespersonsSouthData: { firstName: string; lastName: string; email: string; grade: UserGrade }[] = [
    { firstName: "Dorota",  lastName: "Lewandowska", email: "sp1.south@seller.com", grade: 2 },
    { firstName: "Edward",  lastName: "Wójcik",      email: "sp2.south@seller.com", grade: 1 },
    { firstName: "Felicja", lastName: "Kamińska",    email: "sp3.south@seller.com", grade: 3 },
  ];

  const salespersonsSouth = [];
  for (let i = 0; i < salespersonsSouthData.length; i++) {
    const sp = await User.create({
      ...salespersonsSouthData[i],
      password: "password123",
      role: "salesperson",
      position: salespersonPositionsSouth[i]._id,
      mustChangePassword: true,
      isActive: true,
      createdBy: advisorSouth._id,
    });
    salespersonsSouth.push(sp);
  }

  console.log("Users created");

  // ── LINK POSITIONS → USERS ───────────────────────────────

  directorPosition.currentHolder = director._id;
  await directorPosition.save();

  deputyPosition.currentHolder = deputy._id;
  await deputyPosition.save();

  advisorPositionNorth.currentHolder = advisorNorth._id;
  await advisorPositionNorth.save();

  advisorPositionSouth.currentHolder = advisorSouth._id;
  await advisorPositionSouth.save();

 for (let i = 0; i < 3; i++) {
  await Position.updateOne(
    { _id: salespersonPositionsNorth[i]._id },
    { currentHolder: salespersonsNorth[i]._id }
  );
  await Position.updateOne(
    { _id: salespersonPositionsSouth[i]._id },
    { currentHolder: salespersonsSouth[i]._id }
  );
}

  // ── LINK SUPERREGION → DEPUTY POSITION ───────────────────

  superRegion.deputy = deputyPosition._id;
  await superRegion.save();

  console.log("Relations linked");

  // ── SUMMARY ──────────────────────────────────────────────

  console.log("\n=== Seed completed ===");
  console.log("director@seller.com      / password123");
  console.log("deputy@seller.com        / password123");
  console.log("--- Pomorskie ---");
  console.log("advisor.north@seller.com / password123");
  console.log("sp1.north@seller.com     / password123");
  console.log("sp2.north@seller.com     / password123");
  console.log("sp3.north@seller.com     / password123");
  console.log("--- Małopolskie ---");
  console.log("advisor.south@seller.com / password123");
  console.log("sp1.south@seller.com     / password123");
  console.log("sp2.south@seller.com     / password123");
  console.log("sp3.south@seller.com     / password123");

  await mongoose.connection.close();
};

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });