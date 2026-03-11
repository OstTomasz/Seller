import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../models/User";

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);

  await User.deleteMany({ email: "director@seller.com" });

  await User.create({
    firstName: "Jan",
    lastName: "Dyrektor",
    email: "director@seller.com",
    password: "password123",
    role: "director",
  });

  console.log("Seed completed");
  await mongoose.connection.close();
};

seed().catch(console.error);
