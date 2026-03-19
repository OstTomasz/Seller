import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

import { beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { env } from "../src/config/env";

beforeAll(async () => {
  await mongoose.connect(env.MONGODB_URI);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
    await mongoose.connection.close();
  }
});
