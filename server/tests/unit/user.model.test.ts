import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import User from "../../src/models/User";
import { clearDB } from "../helpers";

describe("User Model", () => {
  beforeEach(async () => {
    await clearDB();
  });

  it("should hash password before saving", async () => {
    const user = await User.create({
      firstName: "Jan",
      lastName: "Kowalski",
      email: "jan@seller.com",
      password: "plainpassword123",
      role: "salesperson",
      grade: 1,
      position: new mongoose.Types.ObjectId(),
    });

    expect(user.password).not.toBe("plainpassword123");
    expect(user.password).toMatch(/^\$2/);
  });

  it("should return true for valid password", async () => {
    const user = await User.create({
      firstName: "Jan",
      lastName: "Kowalski",
      email: "jan@seller.com",
      password: "plainpassword123",
      role: "salesperson",
      grade: 1,
      position: new mongoose.Types.ObjectId(),
    });

    const isValid = await user.comparePassword("plainpassword123");
    expect(isValid).toBe(true);
  });

  it("should return false for invalid password", async () => {
    const user = await User.create({
      firstName: "Jan",
      lastName: "Kowalski",
      email: "jan@seller.com",
      password: "plainpassword123",
      role: "salesperson",
      grade: 1,
      position: new mongoose.Types.ObjectId(),
    });

    const isValid = await user.comparePassword("wrongpassword");
    expect(isValid).toBe(false);
  });

  it("should not expose password in toJSON", async () => {
    const user = await User.create({
      firstName: "Jan",
      lastName: "Kowalski",
      email: "jan@seller.com",
      password: "plainpassword123",
      role: "salesperson",
      grade: 1,
      position: new mongoose.Types.ObjectId(),
    });

    const userJSON = user.toJSON();
    expect(userJSON.password).toBeUndefined();
  });

  it("should reject invalid grade", async () => {
    const user = new User({
      firstName: "Anna",
      lastName: "Nowak",
      email: "anna@seller.com",
      password: "password123",
      role: "advisor",
      grade: 5,
      position: new mongoose.Types.ObjectId(),
    });

    await expect(user.save()).rejects.toThrow();
  });

  it("should require position for salesperson", async () => {
    const user = new User({
      firstName: "Piotr",
      lastName: "Wiśniewski",
      email: "piotr@seller.com",
      password: "password123",
      role: "salesperson",
      grade: 1,
      position: null,
    });

    await expect(user.save()).rejects.toThrow(
      "Position is required for advisor and salesperson", // ← zaktualizowany komunikat
    );
  });

  it("should require grade for salesperson", async () => {
    const user = new User({
      firstName: "Piotr",
      lastName: "Wiśniewski",
      email: "piotr2@seller.com",
      password: "password123",
      role: "salesperson",
      grade: null,
      position: new mongoose.Types.ObjectId(),
    });

    await expect(user.save()).rejects.toThrow("Grade is required for advisor and salesperson");
  });
});
