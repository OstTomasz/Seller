import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../models/User";
import Position from "../models/Position";

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);

  // cleanup
  await User.deleteMany({ email: "director@seller.com" });
  await Position.deleteMany({ code: "DIR-1" });

  // create director position
  const directorPosition = await Position.create({
    code: "DIR-1",
    region: null,
    type: "director",
    currentHolder: null, // will be set after user creation
  });

  // create director user
  const director = await User.create({
    firstName: "Jan",
    lastName: "Dyrektor",
    email: "director@seller.com",
    password: "password123",
    role: "director",
    mustChangePassword: false,
    position: directorPosition._id,
    createdBy: null,
  });

  // assign director to position
  directorPosition.currentHolder = director._id;
  await directorPosition.save();

  console.log("Seed completed: director@seller.com / password123");
  await mongoose.connection.close();
};

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
