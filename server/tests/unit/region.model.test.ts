import { describe, it, expect, beforeEach } from "vitest";
import Region from "../../src/models/Region";

describe("Region Model", () => {
  it("should create a region without deputy", async () => {
    const region = await Region.create({ name: "Północ", prefix: "PN" });

    expect(region.name).toBe("Północ");
    expect(region.prefix).toBe("PN");
    expect(region.deputy).toBeNull();
  });

  it("should not allow duplicate region names", async () => {
    await Region.create({ name: "Północ", prefix: "PN" });
    const duplicate = new Region({ name: "Północ", prefix: "P2" });

    await expect(duplicate.save()).rejects.toThrow();
  });

  it("should not allow duplicate prefixes", async () => {
    await Region.create({ name: "Północ", prefix: "PN" });
    const duplicate = new Region({ name: "Inne", prefix: "PN" });

    await expect(duplicate.save()).rejects.toThrow();
  });

  it("should uppercase prefix automatically", async () => {
    const region = await Region.create({ name: "Południe", prefix: "pd" });

    expect(region.prefix).toBe("PD");
  });

  it("should trim whitespace from name", async () => {
    const region = await Region.create({ name: "  Południe  ", prefix: "PD" });

    expect(region.name).toBe("Południe");
  });

  it("should require name", async () => {
    const region = new Region({ prefix: "PN" });
    await expect(region.save()).rejects.toThrow();
  });

  it("should require prefix", async () => {
    const region = new Region({ name: "Północ" });
    await expect(region.save()).rejects.toThrow();
  });

  it("should create a subregion with parentRegion", async () => {
    const parent = await Region.create({
      name: "Polska Północna",
      prefix: "PP",
    });
    const subregion = await Region.create({
      name: "Pomorze",
      prefix: "PO",
      parentRegion: parent._id,
    });

    expect(subregion.parentRegion?.toString()).toBe(parent._id.toString());
  });

  it("should create a superregion without parentRegion", async () => {
    const superregion = await Region.create({
      name: "Polska Północna",
      prefix: "PP",
    });

    expect(superregion.parentRegion).toBeNull();
  });
});
