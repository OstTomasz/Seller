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
});
