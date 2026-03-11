import { describe, it, expect } from "vitest";
import Region from "../../src/models/Region";
import mongoose from "mongoose";

describe("Region Model", () => {
  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  it("should create a region without deputy", async () => {
    const region = await Region.create({ name: "Północ" });

    expect(region.name).toBe("Północ");
    expect(region.deputy).toBeNull();
  });

  it("should not allow duplicate region names", async () => {
    await Region.create({ name: "Północ" });
    const duplicate = new Region({ name: "Północ" });

    await expect(duplicate.save()).rejects.toThrow();
  });

  it("should trim whitespace from name", async () => {
    const region = await Region.create({ name: "  Południe  " });

    expect(region.name).toBe("Południe");
  });

  it("should require name", async () => {
    const region = new Region({});
    await expect(region.save()).rejects.toThrow();
  });

  it("should create a subregion with parentRegion", async () => {
    const parent = await Region.create({ name: "Polska Północna" });
    const subregion = await Region.create({
      name: "Pomorze",
      parentRegion: parent._id,
    });

    expect(subregion.parentRegion?.toString()).toBe(parent._id.toString());
  });

  it("should create a superregion without parentRegion", async () => {
    const superregion = await Region.create({ name: "Polska Północna" });

    expect(superregion.parentRegion).toBeNull();
  });
});
