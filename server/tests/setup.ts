import { beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";

beforeAll(async () => {
  await mongoose.connect("mongodb://localhost:27017/crm-test");
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});
