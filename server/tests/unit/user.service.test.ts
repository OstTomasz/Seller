import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import User from "../../src/models/User";
import Region from "../../src/models/Region";
import Position from "../../src/models/Position";
import * as userService from "../../src/services/user.service";
import { createTestDB, TestDB } from "../helpers";

let db: TestDB;

beforeEach(async () => {
  db = await createTestDB();
});

// ─── getUsers ─────────────────────────────────────────────────────────────────

describe("getUsers", () => {
  it("should return all users without passwords", async () => {
    const users = await userService.getUsers();
    expect(users).toHaveLength(4);
    users.forEach((u) => expect((u as any).password).toBeUndefined());
  });

  it("should return users sorted by lastName then firstName", async () => {
    const users = await userService.getUsers();
    const lastNames = users.map((u) => u.lastName);
    expect(lastNames).toEqual([...lastNames].sort());
  });
});

// ─── getUserById ──────────────────────────────────────────────────────────────

describe("getUserById", () => {
  it("should return user by id", async () => {
    const user = await userService.getUserById(db.advisorId);
    expect(user.email).toBe("advisor@seller.com");
  });

  it("should throw NotFoundError for non-existent user", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(userService.getUserById(fakeId)).rejects.toThrow("User not found");
  });
});

// ─── createUser ───────────────────────────────────────────────────────────────

describe("createUser", () => {
  it("director should create a salesperson", async () => {
    const vacantPosition = await Position.create({
      code: "PO-99",
      region: db.regionId,
      type: "salesperson",
      currentHolder: null,
    });

    const user = await userService.createUser(
      {
        firstName: "New",
        lastName: "User",
        email: "new@seller.com",
        temporaryPassword: "temp1234",
        phone: "+48 600 000 001",
        grade: 1,
        positionId: vacantPosition._id.toString(),
      },
      db.directorId,
      "director",
    );

    expect(user.email).toBe("new@seller.com");
    expect(user.mustChangePassword).toBe(true);
    expect(user.createdBy?.toString()).toBe(db.directorId);
  });

  it("deputy should create a salesperson in own region", async () => {
    // create a vacant salesperson position in deputy's region
    const vacantPosition = await Position.create({
      code: "PO-99",
      region: db.regionId,
      type: "salesperson",
      currentHolder: null,
    });

    const user = await userService.createUser(
      {
        firstName: "New",
        lastName: "User",
        email: "new@seller.com",
        temporaryPassword: "temp1234",
        phone: "+48 600 000 001",
        grade: 1,
        positionId: vacantPosition._id.toString(),
      },
      db.deputyId,
      "deputy",
    );

    expect(user.email).toBe("new@seller.com");
  });

  it("deputy should NOT create a director", async () => {
    await expect(
      userService.createUser(
        {
          firstName: "New",
          lastName: "Director",
          email: "new@seller.com",
          temporaryPassword: "temp1234",
          phone: "+48 600 000 001",
          positionId: db.directorPositionId,
        },
        db.deputyId,
        "deputy",
      ),
    ).rejects.toThrow("Forbidden");
  });

  it("deputy should NOT create a user in another superregion region", async () => {
    const otherSuperregion = await Region.create({
      name: "South Poland",
      prefix: "SP", // ← dodaj prefix
    });
    const outsideRegion = await Region.create({
      name: "Lesser Poland",
      prefix: "LP", // ← dodaj prefix
      parentRegion: otherSuperregion._id,
    });
    const outsidePosition = await Position.create({
      code: "LP-2",
      region: outsideRegion._id,
      type: "salesperson",
      currentHolder: null,
    });

    await expect(
      userService.createUser(
        {
          firstName: "New",
          lastName: "User",
          email: "new@seller.com",
          temporaryPassword: "temp1234",
          phone: "+48 600 000 001",
          grade: 1,
          positionId: outsidePosition._id.toString(),
        },
        db.deputyId,
        "deputy",
      ),
    ).rejects.toThrow("Forbidden");
  });

  it("should throw ConflictError for duplicate email", async () => {
    await expect(
      userService.createUser(
        {
          firstName: "New",
          lastName: "User",
          email: "advisor@seller.com",
          temporaryPassword: "temp1234",
          phone: "+48 600 000 001",
          grade: 1,
          positionId: db.salespersonPositionId,
        },
        db.directorId,
        "director",
      ),
    ).rejects.toThrow("User with this email already exists");
  });

  it("should throw BadRequestError for email not ending with @seller.com", async () => {
    await expect(
      userService.createUser(
        {
          firstName: "New",
          lastName: "User",
          email: "new@gmail.com",
          temporaryPassword: "temp1234",
          phone: "+48 600 000 001",
          positionId: db.salespersonPositionId,
          grade: 1,
        },
        db.directorId,
        "director",
      ),
    ).rejects.toThrow("Email must end with @seller.com");
  });
});

// ─── updateUser ───────────────────────────────────────────────────────────────

describe("updateUser", () => {
  it("director should update user", async () => {
    const updated = await userService.updateUser(
      db.advisorId,
      { firstName: "Updated" },
      db.directorId,
      "director",
    );

    expect(updated.firstName).toBe("Updated");
  });

  it("deputy should update user in own region", async () => {
    const updated = await userService.updateUser(
      db.advisorId,
      { firstName: "Updated" },
      db.deputyId,
      "deputy",
    );

    expect(updated.firstName).toBe("Updated");
  });

  it("deputy should NOT update user outside own superregion", async () => {
    const otherSuperregion = await Region.create({
      name: "South Poland",
      prefix: "SP",
    });
    const outsideRegion = await Region.create({
      name: "Lesser Poland",
      prefix: "LP",
      parentRegion: otherSuperregion._id,
    });
    const outsidePosition = await Position.create({
      code: "LP-2",
      region: outsideRegion._id,
      type: "salesperson",
      currentHolder: null,
    });
    const outsideUser = await User.create({
      firstName: "Outside",
      lastName: "User",
      email: "outside@seller.com",
      password: "password123",
      role: "salesperson",
      grade: 1,
      position: outsidePosition._id,
      mustChangePassword: false,
    });

    await expect(
      userService.updateUser(
        outsideUser._id.toString(),
        { firstName: "Updated" },
        db.deputyId,
        "deputy",
      ),
    ).rejects.toThrow("Forbidden");
  });

  it("should throw NotFoundError for non-existent user", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(
      userService.updateUser(fakeId, { firstName: "Updated" }, db.directorId, "director"),
    ).rejects.toThrow("User not found");
  });
});

// ─── updateUserRoleAndGrade ───────────────────────────────────────────────────

describe("updateUserRoleAndGrade", () => {
  it("should update role and grade", async () => {
    const updated = await userService.updateUserRoleAndGrade(db.advisorId, "salesperson", 2);
    expect(updated.role).toBe("salesperson");
    expect(updated.grade).toBe(2);
  });

  it("should set grade to null when changing to director", async () => {
    const updated = await userService.updateUserRoleAndGrade(db.advisorId, "director", null);
    expect(updated.role).toBe("director");
    expect(updated.grade).toBeNull();
  });

  it("should throw BadRequestError when grade missing for salesperson", async () => {
    await expect(
      userService.updateUserRoleAndGrade(db.advisorId, "salesperson", null),
    ).rejects.toThrow("Grade is required for advisor and salesperson");
  });

  it("should throw NotFoundError for non-existent user", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(userService.updateUserRoleAndGrade(fakeId, "salesperson", 1)).rejects.toThrow(
      "User not found",
    );
  });
});

// ─── toggleUserActive ─────────────────────────────────────────────────────────

describe("toggleUserActive", () => {
  it("should deactivate active user", async () => {
    const updated = await userService.toggleUserActive(db.advisorId, db.directorId, "director");
    expect(updated.isActive).toBe(false);
  });

  it("should reactivate inactive user", async () => {
    await User.findByIdAndUpdate(db.advisorId, { isActive: false });
    const updated = await userService.toggleUserActive(db.advisorId, db.directorId, "director");
    expect(updated.isActive).toBe(true);
  });

  it("should throw BadRequestError when deactivating yourself", async () => {
    await expect(
      userService.toggleUserActive(db.directorId, db.directorId, "director"),
    ).rejects.toThrow("Cannot deactivate yourself");
  });

  it("deputy should NOT toggle user outside own superregion", async () => {
    const otherSuperregion = await Region.create({
      name: "South Poland",
      prefix: "SP",
    });
    const outsideRegion = await Region.create({
      name: "Lesser Poland",
      prefix: "LP",
      parentRegion: otherSuperregion._id,
    });
    const outsidePosition = await Position.create({
      code: "LP-2",
      region: outsideRegion._id,
      type: "salesperson",
      currentHolder: null,
    });
    const outsideUser = await User.create({
      firstName: "Outside",
      lastName: "User",
      email: "outside@seller.com",
      password: "password123",
      role: "salesperson",
      grade: 1,
      position: outsidePosition._id,
      mustChangePassword: false,
    });

    await expect(
      userService.toggleUserActive(outsideUser._id.toString(), db.deputyId, "deputy"),
    ).rejects.toThrow("Forbidden");
  });
});

// ─── changePassword ───────────────────────────────────────────────────────────

describe("changePassword", () => {
  it("should change password and set mustChangePassword to false", async () => {
    await userService.changePassword(db.advisorId, "password123", "newpassword123");

    const user = await User.findById(db.advisorId);
    expect(user?.mustChangePassword).toBe(false);

    const isValid = await user?.comparePassword("newpassword123");
    expect(isValid).toBe(true);
  });

  it("should throw BadRequestError for wrong current password", async () => {
    await expect(
      userService.changePassword(db.advisorId, "wrongpassword", "newpassword123"),
    ).rejects.toThrow("Current password is incorrect");
  });

  it("should throw NotFoundError for non-existent user", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(
      userService.changePassword(fakeId, "password123", "newpassword123"),
    ).rejects.toThrow("User not found");
  });
});

// ─── resetPassword ────────────────────────────────────────────────────────────

describe("resetPassword", () => {
  it("should reset password and set mustChangePassword to true", async () => {
    await userService.resetPassword(db.advisorId, "temp1234", db.directorId, "director");

    const user = await User.findById(db.advisorId);
    expect(user?.mustChangePassword).toBe(true);

    const isValid = await user?.comparePassword("temp1234");
    expect(isValid).toBe(true);
  });

  it("deputy should reset password of user in own region", async () => {
    await expect(
      userService.resetPassword(db.advisorId, "temp1234", db.deputyId, "deputy"),
    ).resolves.not.toThrow();
  });

  it("deputy should NOT reset password of user outside own superregion", async () => {
    const otherSuperregion = await Region.create({
      name: "South Poland",
      prefix: "SP",
    });
    const outsideRegion = await Region.create({
      name: "Lesser Poland",
      prefix: "LP",
      parentRegion: otherSuperregion._id,
    });
    const outsidePosition = await Position.create({
      code: "LP-2",
      region: outsideRegion._id,
      type: "salesperson",
      currentHolder: null,
    });
    const outsideUser = await User.create({
      firstName: "Outside",
      lastName: "User",
      email: "outside@seller.com",
      password: "password123",
      role: "salesperson",
      grade: 1,
      position: outsidePosition._id,
      mustChangePassword: false,
    });

    await expect(
      userService.resetPassword(outsideUser._id.toString(), "temp1234", db.deputyId, "deputy"),
    ).rejects.toThrow("Forbidden");
  });

  it("should throw NotFoundError for non-existent user", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(
      userService.resetPassword(fakeId, "temp1234", db.directorId, "director"),
    ).rejects.toThrow("User not found");
  });
});
