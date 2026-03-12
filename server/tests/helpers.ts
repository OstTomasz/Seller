import request from "supertest";
import app from "../src/app";
import mongoose from "mongoose";
import User from "../src/models/User";
import Region from "../src/models/Region";

export const clearDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

export const loginAs = async (
  email: string,
  password = "password123",
): Promise<string> => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
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
}

export interface TestContext {
  directorToken: string;
  deputyToken: string;
  advisorToken: string;
  salespersonToken: string;
  directorId: string;
  deputyId: string;
  advisorId: string;
  salespersonId: string;
  superregionId: string;
  regionId: string;
  otherRegionId: string;
}

export const createTestDB = async (): Promise<TestDB> => {
  const superregion = await Region.create({ name: "North Poland" });
  const region = await Region.create({
    name: "Pomerania",
    parentRegion: superregion._id,
  });
  const otherRegion = await Region.create({
    name: "Silesia",
    parentRegion: superregion._id,
  });

  const director = await User.create({
    firstName: "Jan",
    lastName: "Director",
    email: "director@test.com",
    password: "password123",
    role: "director",
    mustChangePassword: false,
  });

  const deputy = await User.create({
    firstName: "Anna",
    lastName: "Deputy",
    email: "deputy@test.com",
    password: "password123",
    role: "deputy",
    mustChangePassword: false,
  });

  await Region.findByIdAndUpdate(superregion._id, { deputy: deputy._id });

  const advisor = await User.create({
    firstName: "Piotr",
    lastName: "Advisor",
    email: "advisor@test.com",
    password: "password123",
    role: "advisor",
    grade: 1,
    region: region._id,
    mustChangePassword: false,
  });

  const salesperson = await User.create({
    firstName: "Marek",
    lastName: "Salesperson",
    email: "salesperson@test.com",
    password: "password123",
    role: "salesperson",
    grade: 1,
    region: region._id,
    mustChangePassword: false,
  });

  return {
    directorId: director._id.toString(),
    deputyId: deputy._id.toString(),
    advisorId: advisor._id.toString(),
    salespersonId: salesperson._id.toString(),
    superregionId: superregion._id.toString(),
    regionId: region._id.toString(),
    otherRegionId: otherRegion._id.toString(),
  };
};

export const createTestContext = async (): Promise<TestContext> => {
  const db = await createTestDB();

  const [directorToken, deputyToken, advisorToken, salespersonToken] =
    await Promise.all([
      loginAs("director@test.com"),
      loginAs("deputy@test.com"),
      loginAs("advisor@test.com"),
      loginAs("salesperson@test.com"),
    ]);

  return { ...db, directorToken, deputyToken, advisorToken, salespersonToken };
};
