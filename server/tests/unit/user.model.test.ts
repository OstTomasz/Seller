import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import User from "../../src/models/User";

describe("User Model", () => {
  it("should hash password before saving", async () => {
    const user = new User({
      firstName: "Jan",
      lastName: "Kowalski",
      email: "jan@test.com",
      password: "plainpassword123",
      role: "salesperson",
      grade: 1,
      region: new mongoose.Types.ObjectId(),
    });

    await user.save();

    // pwd in db not the same as plain
    expect(user.password).not.toBe("plainpassword123");
    // Hash bcrypt always starts with $2
    expect(user.password).toMatch(/^\$2/);
  });

  it("should return true for valid password", async () => {
    const user = await User.findOne({ email: "jan@test.com" });
    const isValid = await user!.comparePassword("plainpassword123");
    expect(isValid).toBe(true);
  });

  it("should return false for invalid password", async () => {
    const user = await User.findOne({ email: "jan@test.com" });
    const isValid = await user!.comparePassword("wrongpassword");
    expect(isValid).toBe(false);
  });

  it("should not expose password in toJSON", async () => {
    const user = await User.findOne({ email: "jan@test.com" });
    const userJSON = user!.toJSON();
    expect(userJSON.password).toBeUndefined();
  });

  it("should reject invalid grade", async () => {
    const user = new User({
      firstName: "Anna",
      lastName: "Nowak",
      email: "anna@test.com",
      password: "password123",
      role: "advisor",
      grade: 5, // incorrect val
      region: new mongoose.Types.ObjectId(),
    });

    await expect(user.save()).rejects.toThrow();
  });
  it("should require region for salesperson", async () => {
    const user = new User({
      firstName: "Piotr",
      lastName: "Wiśniewski",
      email: "piotr@test.com",
      password: "password123",
      role: "salesperson",
      grade: 1,
      region: null, // no region
    });

    await expect(user.save()).rejects.toThrow(
      "Region is required for advisor and salesperson",
    );
  });

  it("should require grade for salesperson", async () => {
    const user = new User({
      firstName: "Piotr",
      lastName: "Wiśniewski",
      email: "piotr2@test.com",
      password: "password123",
      role: "salesperson",
      grade: null, // no grade
      region: new mongoose.Types.ObjectId(),
    });

    await expect(user.save()).rejects.toThrow(
      "Grade is required for advisor and salesperson",
    );
  });
});
