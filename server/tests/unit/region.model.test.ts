import { describe, it, expect } from "vitest";
import Region from "../../src/models/Region";

describe("Region Model", () => {
  it("should create a region without deputy", async () => {
    const region = new Region({ name: "Północ" });
    await region.save();

    expect(region.name).toBe("Północ");
    expect(region.deputy).toBeNull();
  });

  it("should not allow duplicate region names", async () => {
    const duplicate = new Region({ name: "Północ" });
    await expect(duplicate.save()).rejects.toThrow();
  });

  it("should trim whitespace from name", async () => {
    const region = new Region({ name: "  Południe  " });
    await region.save();

    expect(region.name).toBe("Południe");
  });

  it("should require name", async () => {
    const region = new Region({});
    await expect(region.save()).rejects.toThrow();
  });
  it("should create a subregion with parentRegion", async () => {
    const parent = await Region.findOne({ name: "Północ" });

    const subregion = new Region({
      name: "Pomorze",
      parentRegion: parent!._id,
    });
    await subregion.save();

    expect(subregion.parentRegion?.toString()).toBe(parent!._id.toString());
  });

  it("should create a superregion without parentRegion", async () => {
    const superregion = new Region({ name: "Polska Północna" });
    await superregion.save();

    expect(superregion.parentRegion).toBeNull();
  });
});
