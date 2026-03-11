import request from "supertest";
import app from "../src/app";
import mongoose from "mongoose";

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
