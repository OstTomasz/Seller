import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/repositories/user.repository", () => ({
  findRawUserById: vi.fn(),
  findAllUsers: vi.fn(),
}));

vi.mock("../../src/repositories/position.repository", () => ({
  findPositionById: vi.fn(),
  findPositionsByRegionIds: vi.fn(),
}));

vi.mock("../../src/repositories/region.repository", () => ({
  findSubregionsByParentId: vi.fn(),
}));

import * as rbacUtils from "../../src/utils/rbac";
import * as userRepository from "../../src/repositories/user.repository";
import * as positionRepository from "../../src/repositories/position.repository";
import * as regionRepository from "../../src/repositories/region.repository";

describe("rbac utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty arrays when deputy has no position", async () => {
    vi.mocked(userRepository.findRawUserById).mockResolvedValue(null);

    await expect(rbacUtils.getPositionIdsInSuperregion("d1")).resolves.toEqual([]);
    await expect(rbacUtils.getSubordinateUserIdsForDeputy("d1")).resolves.toEqual([]);
  });

  it("returns empty list when superregion has no subregions", async () => {
    vi.mocked(userRepository.findRawUserById).mockResolvedValue(
      { position: { toString: () => "pos-1" } } as unknown as never,
    );
    vi.mocked(positionRepository.findPositionById).mockResolvedValue(
      { region: { toString: () => "super-1" } } as unknown as never,
    );
    vi.mocked(regionRepository.findSubregionsByParentId).mockResolvedValue([]);

    await expect(rbacUtils.getUserIdsBySuperregionId("super-1")).resolves.toEqual([]);
  });

  it("returns unique user ids for region and superregion", async () => {
    vi.mocked(positionRepository.findPositionsByRegionIds).mockResolvedValue(
      [
        { currentHolder: { toString: () => "u1" }, _id: { toString: () => "p1" } },
        { currentHolder: { toString: () => "u1" }, _id: { toString: () => "p2" } },
        { currentHolder: { toString: () => "u2" }, _id: { toString: () => "p3" } },
      ] as unknown as never,
    );

    const byRegion = await rbacUtils.getUserIdsByRegionId("r1");
    expect(byRegion).toEqual(["u1", "u2"]);

    vi.mocked(regionRepository.findSubregionsByParentId).mockResolvedValue(
      [{ _id: { toString: () => "r-sub-1" } }] as unknown as never,
    );
    const bySuperregion = await rbacUtils.getUserIdsBySuperregionId("r-super");
    expect(bySuperregion).toEqual(["u1", "u2"]);
  });

  it("returns subordinate ids for director (excluding directors and inactive users)", async () => {
    vi.mocked(userRepository.findAllUsers).mockResolvedValue(
      [
        { _id: { toString: () => "d1" }, role: "director", isActive: true },
        { _id: { toString: () => "a1" }, role: "advisor", isActive: true },
        { _id: { toString: () => "s1" }, role: "salesperson", isActive: false },
        { _id: { toString: () => "s2" }, role: "salesperson", isActive: true },
      ] as unknown as never,
    );

    const ids = await rbacUtils.getSubordinateUserIdsForDirector();
    expect(ids).toEqual(["a1", "s2"]);
  });
});
