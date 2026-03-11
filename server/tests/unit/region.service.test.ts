import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import Region from "../../src/models/Region";
import User from "../../src/models/User";
import * as regionService from "../../src/services/region.service";
import { ForbiddenError, NotFoundError } from "../../src/utils/errors";
import { clearDB } from "../helpers";

describe("Region Service", () => {
  beforeEach(async () => {
    await clearDB();
  });

  // ─── createRegion ───────────────────────────────────────────────────────────

  describe("createRegion", () => {
    it("director should create a superregion", async () => {
      const region = await regionService.createRegion(
        "North Poland",
        new mongoose.Types.ObjectId().toString(),
        "director",
      );

      expect(region.name).toBe("North Poland");
      expect(region.parentRegion).toBeNull();
    });

    it("director should create a subregion", async () => {
      const superregion = await Region.create({ name: "North Poland" });

      const region = await regionService.createRegion(
        "Pomerania",
        new mongoose.Types.ObjectId().toString(),
        "director",
        superregion._id.toString(),
      );

      expect(region.parentRegion?.toString()).toBe(superregion._id.toString());
    });

    it("deputy should NOT create a superregion", async () => {
      await expect(
        regionService.createRegion(
          "North Poland",
          new mongoose.Types.ObjectId().toString(),
          "deputy",
        ),
      ).rejects.toThrow(ForbiddenError);
    });

    it("deputy should NOT create a subregion in another deputy superregion", async () => {
      const otherDeputy = await User.create({
        firstName: "Other",
        lastName: "Deputy",
        email: "other@test.com",
        password: "password123",
        role: "deputy",
      });

      const superregion = await Region.create({
        name: "North Poland",
        deputy: otherDeputy._id,
      });

      const myDeputyId = new mongoose.Types.ObjectId().toString();

      await expect(
        regionService.createRegion(
          "Pomerania",
          myDeputyId,
          "deputy",
          superregion._id.toString(),
        ),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  // ─── updateRegionName ───────────────────────────────────────────────────────

  describe("updateRegionName", () => {
    it("should update region name", async () => {
      const region = await Region.create({ name: "Old Name" });

      const updated = await regionService.updateRegionName(
        region._id.toString(),
        "New Name",
        new mongoose.Types.ObjectId().toString(),
        "director",
      );

      expect(updated.name).toBe("New Name");
    });

    it("should throw NotFoundError for non-existent region", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        regionService.updateRegionName(
          fakeId,
          "New Name",
          new mongoose.Types.ObjectId().toString(),
          "director",
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it("deputy should NOT update superregion name", async () => {
      const deputy = await User.create({
        firstName: "Anna",
        lastName: "Deputy",
        email: "deputy@test.com",
        password: "password123",
        role: "deputy",
      });

      const superregion = await Region.create({
        name: "North Poland",
        deputy: deputy._id,
      });

      await expect(
        regionService.updateRegionName(
          superregion._id.toString(),
          "New Name",
          deputy._id.toString(),
          "deputy",
        ),
      ).rejects.toThrow(ForbiddenError);
    });

    it("deputy should NOT update subregion name from another superregion", async () => {
      const myDeputy = await User.create({
        firstName: "My",
        lastName: "Deputy",
        email: "mydeputy@test.com",
        password: "password123",
        role: "deputy",
      });

      const otherDeputy = await User.create({
        firstName: "Other",
        lastName: "Deputy",
        email: "otherdeputy@test.com",
        password: "password123",
        role: "deputy",
      });

      // superregion belongs to otherDeputy
      const superregion = await Region.create({
        name: "South Poland",
        deputy: otherDeputy._id,
      });

      const subregion = await Region.create({
        name: "Silesia",
        parentRegion: superregion._id,
      });

      await expect(
        regionService.updateRegionName(
          subregion._id.toString(),
          "New Name",
          myDeputy._id.toString(),
          "deputy",
        ),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  // ─── deleteRegion ───────────────────────────────────────────────────────────

  describe("deleteRegion", () => {
    it("should delete a region", async () => {
      const region = await Region.create({ name: "Pomerania" });

      await regionService.deleteRegion(
        region._id.toString(),
        new mongoose.Types.ObjectId().toString(),
        "director",
      );

      const found = await Region.findById(region._id);
      expect(found).toBeNull();
    });

    it("should throw NotFoundError for non-existent region", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        regionService.deleteRegion(
          fakeId,
          new mongoose.Types.ObjectId().toString(),
          "director",
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it("should NOT delete region with subregions", async () => {
      const superregion = await Region.create({ name: "North Poland" });
      await Region.create({ name: "Pomerania", parentRegion: superregion._id });

      await expect(
        regionService.deleteRegion(
          superregion._id.toString(),
          new mongoose.Types.ObjectId().toString(),
          "director",
        ),
      ).rejects.toThrow("Cannot delete region with subregions");
    });

    it("deputy should NOT delete superregion", async () => {
      const deputy = await User.create({
        firstName: "Anna",
        lastName: "Deputy",
        email: "deputy@test.com",
        password: "password123",
        role: "deputy",
      });

      const superregion = await Region.create({
        name: "North Poland",
        deputy: deputy._id,
      });

      await expect(
        regionService.deleteRegion(
          superregion._id.toString(),
          deputy._id.toString(),
          "deputy",
        ),
      ).rejects.toThrow(ForbiddenError);
    });

    it("deputy should NOT delete subregion from another superregion", async () => {
      const myDeputy = await User.create({
        firstName: "My",
        lastName: "Deputy",
        email: "mydeputy@test.com",
        password: "password123",
        role: "deputy",
      });

      const otherDeputy = await User.create({
        firstName: "Other",
        lastName: "Deputy",
        email: "otherdeputy@test.com",
        password: "password123",
        role: "deputy",
      });

      // superregion belongs to otherDeputy
      const superregion = await Region.create({
        name: "South Poland",
        deputy: otherDeputy._id,
      });

      const subregion = await Region.create({
        name: "Silesia",
        parentRegion: superregion._id,
      });

      await expect(
        regionService.deleteRegion(
          subregion._id.toString(),
          myDeputy._id.toString(),
          "deputy",
        ),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  // ─── getRegionById ──────────────────────────────────────────────────────────

  describe("getRegionById", () => {
    it("should return region by id", async () => {
      const region = await Region.create({ name: "Pomerania" });

      const found = await regionService.getRegionById(region._id.toString());

      expect(found.name).toBe("Pomerania");
    });

    it("should throw NotFoundError for non-existent region", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(regionService.getRegionById(fakeId)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
