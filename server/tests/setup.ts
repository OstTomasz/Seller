import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

import { beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { env } from "../src/config/env";

const clearCollections = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

beforeAll(async () => {
  await mongoose.connect(env.MONGODB_URI);
});

beforeEach(async () => {
  await clearCollections();
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await clearCollections();
    await mongoose.connection.close();
  }
});
