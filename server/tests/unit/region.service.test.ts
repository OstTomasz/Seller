import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import Region from "../../src/models/Region";
import Position from "../../src/models/Position";
import User from "../../src/models/User";
import * as regionService from "../../src/services/region.service";
import { ForbiddenError, NotFoundError } from "../../src/utils/errors";

describe("Region Service", () => {
  // ─── createRegion ───────────────────────────────────────────────────────────

  describe("createRegion", () => {
    it("director should create a superregion", async () => {
      const region = await regionService.createRegion(
        "North Poland",
        "NP",
        new mongoose.Types.ObjectId().toString(),
        "director",
      );

      expect(region.name).toBe("North Poland");
      expect(region.parentRegion).toBeNull();
    });

    it("should auto-create deputy position for superregion", async () => {
      const region = await regionService.createRegion(
        "North Poland",
        "NP",
        new mongoose.Types.ObjectId().toString(),
        "director",
      );

      const position = await Position.findOne({
        region: region._id,
        type: "deputy",
      });
      expect(position).not.toBeNull();
      expect(position?.code).toBe("NP-1");
      expect(position?.currentHolder).toBeNull();
    });

    it("should auto-create advisor position for subregion", async () => {
      const superregion = await Region.create({
        name: "North Poland",
        prefix: "NP",
      });

      const region = await regionService.createRegion(
        "Pomerania",
        "PO",
        new mongoose.Types.ObjectId().toString(),
        "director",
        superregion._id.toString(),
      );

      const position = await Position.findOne({
        region: region._id,
        type: "advisor",
      });
      expect(position).not.toBeNull();
      expect(position?.code).toBe("PO-1");
    });

    it("director should create a subregion", async () => {
      const superregion = await Region.create({
        name: "North Poland",
        prefix: "NP",
      });

      const region = await regionService.createRegion(
        "Pomerania",
        "PO",
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
          "NP",
          new mongoose.Types.ObjectId().toString(),
          "deputy",
        ),
      ).rejects.toThrow(ForbiddenError);
    });

    it("deputy should NOT create a subregion in another deputy superregion", async () => {
      // create other deputy with position
      const otherDeputyPosition = await Position.create({
        code: "NP-1",
        region: null,
        type: "deputy",
        currentHolder: null,
      });
      const otherDeputy = await User.create({
        firstName: "Other",
        lastName: "Deputy",
        email: "other@seller.com",
        password: "password123",
        role: "deputy",
        mustChangePassword: false,
        position: otherDeputyPosition._id,
      });
      await Position.findByIdAndUpdate(otherDeputyPosition._id, {
        currentHolder: otherDeputy._id,
      });

      const superregion = await Region.create({
        name: "North Poland",
        prefix: "NP",
        deputy: otherDeputyPosition._id,
      });
      await Position.findByIdAndUpdate(otherDeputyPosition._id, {
        region: superregion._id,
      });

      const myDeputyId = new mongoose.Types.ObjectId().toString();

      await expect(
        regionService.createRegion(
          "Pomerania",
          "PO",
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
      const region = await Region.create({ name: "Old Name", prefix: "ON" });

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
      const deputyPosition = await Position.create({
        code: "NP-1",
        region: null,
        type: "deputy",
        currentHolder: null,
      });
      const deputy = await User.create({
        firstName: "Anna",
        lastName: "Deputy",
        email: "deputy@seller.com",
        password: "password123",
        role: "deputy",
        mustChangePassword: false,
        position: deputyPosition._id,
      });
      await Position.findByIdAndUpdate(deputyPosition._id, {
        currentHolder: deputy._id,
      });

      const superregion = await Region.create({
        name: "North Poland",
        prefix: "NP",
        deputy: deputyPosition._id,
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
      const myDeputyPosition = await Position.create({
        code: "SP-1",
        region: null,
        type: "deputy",
        currentHolder: null,
      });
      const myDeputy = await User.create({
        firstName: "My",
        lastName: "Deputy",
        email: "mydeputy@seller.com",
        password: "password123",
        role: "deputy",
        mustChangePassword: false,
        position: myDeputyPosition._id,
      });
      await Position.findByIdAndUpdate(myDeputyPosition._id, {
        currentHolder: myDeputy._id,
      });

      const otherDeputyPosition = await Position.create({
        code: "NP-1",
        region: null,
        type: "deputy",
        currentHolder: null,
      });
      const otherDeputy = await User.create({
        firstName: "Other",
        lastName: "Deputy",
        email: "otherdeputy@seller.com",
        password: "password123",
        role: "deputy",
        mustChangePassword: false,
        position: otherDeputyPosition._id,
      });
      await Position.findByIdAndUpdate(otherDeputyPosition._id, {
        currentHolder: otherDeputy._id,
      });

      const superregion = await Region.create({
        name: "South Poland",
        prefix: "SP",
        deputy: otherDeputyPosition._id,
      });

      const subregion = await Region.create({
        name: "Silesia",
        prefix: "SL",
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
      const region = await Region.create({ name: "Pomerania", prefix: "PO" });

      await regionService.deleteRegion(
        region._id.toString(),
        new mongoose.Types.ObjectId().toString(),
        "director",
      );

      const found = await Region.findById(region._id);
      expect(found).toBeNull();
    });

    it("should delete positions when region is deleted", async () => {
      const region = await Region.create({ name: "Pomerania", prefix: "PO" });
      await Position.create({
        code: "PO-1",
        region: region._id,
        type: "advisor",
        currentHolder: null,
      });

      await regionService.deleteRegion(
        region._id.toString(),
        new mongoose.Types.ObjectId().toString(),
        "director",
      );

      const positions = await Position.find({ region: region._id });
      expect(positions).toHaveLength(0);
    });

    it("should throw NotFoundError for non-existent region", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        regionService.deleteRegion(fakeId, new mongoose.Types.ObjectId().toString(), "director"),
      ).rejects.toThrow(NotFoundError);
    });

    it("should NOT delete region with subregions", async () => {
      const superregion = await Region.create({
        name: "North Poland",
        prefix: "NP",
      });
      await Region.create({
        name: "Pomerania",
        prefix: "PO",
        parentRegion: superregion._id,
      });

      await expect(
        regionService.deleteRegion(
          superregion._id.toString(),
          new mongoose.Types.ObjectId().toString(),
          "director",
        ),
      ).rejects.toThrow("Cannot delete region with subregions");
    });

    it("deputy should NOT delete superregion", async () => {
      const deputyPosition = await Position.create({
        code: "NP-1",
        region: null,
        type: "deputy",
        currentHolder: null,
      });
      const deputy = await User.create({
        firstName: "Anna",
        lastName: "Deputy",
        email: "deputy@seller.com",
        password: "password123",
        role: "deputy",
        mustChangePassword: false,
        position: deputyPosition._id,
      });
      await Position.findByIdAndUpdate(deputyPosition._id, {
        currentHolder: deputy._id,
      });

      const superregion = await Region.create({
        name: "North Poland",
        prefix: "NP",
        deputy: deputyPosition._id,
      });

      await expect(
        regionService.deleteRegion(superregion._id.toString(), deputy._id.toString(), "deputy"),
      ).rejects.toThrow(ForbiddenError);
    });

    it("deputy should NOT delete subregion from another superregion", async () => {
      const myDeputyPosition = await Position.create({
        code: "SP-1",
        region: null,
        type: "deputy",
        currentHolder: null,
      });
      const myDeputy = await User.create({
        firstName: "My",
        lastName: "Deputy",
        email: "mydeputy@seller.com",
        password: "password123",
        role: "deputy",
        mustChangePassword: false,
        position: myDeputyPosition._id,
      });
      await Position.findByIdAndUpdate(myDeputyPosition._id, {
        currentHolder: myDeputy._id,
      });

      const otherDeputyPosition = await Position.create({
        code: "NP-1",
        region: null,
        type: "deputy",
        currentHolder: null,
      });
      const otherDeputy = await User.create({
        firstName: "Other",
        lastName: "Deputy",
        email: "otherdeputy@seller.com",
        password: "password123",
        role: "deputy",
        mustChangePassword: false,
        position: otherDeputyPosition._id,
      });
      await Position.findByIdAndUpdate(otherDeputyPosition._id, {
        currentHolder: otherDeputy._id,
      });

      const superregion = await Region.create({
        name: "South Poland",
        prefix: "SP",
        deputy: otherDeputyPosition._id,
      });

      const subregion = await Region.create({
        name: "Silesia",
        prefix: "SL",
        parentRegion: superregion._id,
      });

      await expect(
        regionService.deleteRegion(subregion._id.toString(), myDeputy._id.toString(), "deputy"),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  // ─── getRegionById ──────────────────────────────────────────────────────────

  describe("getRegionById", () => {
    it("should return region by id", async () => {
      const region = await Region.create({ name: "Pomerania", prefix: "PO" });

      const found = await regionService.getRegionById(region._id.toString());

      expect(found.name).toBe("Pomerania");
    });

    it("should throw NotFoundError for non-existent region", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(regionService.getRegionById(fakeId)).rejects.toThrow(NotFoundError);
    });
  });
});
