import { beforeEach, describe, expect, it, vi } from "vitest";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../src/utils/errors";

vi.mock("../../src/repositories/position.repository", () => ({
  findAllPositionsPopulated: vi.fn(),
  findPositionById: vi.fn(),
  createPosition: vi.fn(),
  deletePositionById: vi.fn(),
  updatePositionCode: vi.fn(),
}));

vi.mock("../../src/repositories/region.repository", () => ({
  findRegionById: vi.fn(),
}));

vi.mock("../../src/models/Client", () => ({
  default: {
    countDocuments: vi.fn(),
  },
}));

import * as service from "../../src/services/position.service";
import * as positionRepository from "../../src/repositories/position.repository";
import * as regionRepository from "../../src/repositories/region.repository";
import Client from "../../src/models/Client";

describe("position.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns positions list", async () => {
    vi.mocked(positionRepository.findAllPositionsPopulated).mockResolvedValue([{ _id: "p1" }] as never);
    await expect(service.getPositions()).resolves.toHaveLength(1);
  });

  it("creates salesperson position for director in subregion", async () => {
    vi.mocked(regionRepository.findRegionById).mockResolvedValue(
      { _id: "r1", parentRegion: { toString: () => "sr1" } } as never,
    );
    vi.mocked(positionRepository.createPosition).mockResolvedValue({ _id: "p1" } as never);

    await service.createSalespersonPosition("r1", "SP-NEW-1", "director-id", "director");
    expect(positionRepository.createPosition).toHaveBeenCalledTimes(1);
  });

  it("blocks creating salesperson position in superregion", async () => {
    vi.mocked(regionRepository.findRegionById).mockResolvedValue(
      { _id: "r1", parentRegion: null } as never,
    );

    await expect(
      service.createSalespersonPosition("r1", "SP-NEW-1", "director-id", "director"),
    ).rejects.toThrow(BadRequestError);
  });

  it("validates deputy access for create position", async () => {
    vi.mocked(regionRepository.findRegionById)
      .mockResolvedValueOnce({ _id: "region", parentRegion: { toString: () => "super-1" } } as never)
      .mockResolvedValueOnce({ _id: "super-1", deputy: { toString: () => "dep-pos-1" } } as never)
      .mockResolvedValueOnce({ _id: "region", parentRegion: { toString: () => "super-1" } } as never);

    vi.mocked(positionRepository.findPositionById).mockResolvedValue(
      { currentHolder: { toString: () => "deputy-user" } } as never,
    );
    vi.mocked(positionRepository.createPosition).mockResolvedValue({ _id: "p1" } as never);

    await service.createSalespersonPosition("region", "SP-1", "deputy-user", "deputy");
    expect(positionRepository.createPosition).toHaveBeenCalledTimes(1);
  });

  it("throws not found when deleting unknown position", async () => {
    vi.mocked(positionRepository.findPositionById).mockResolvedValue(null);
    await expect(service.deleteSalespersonPosition("missing", "u1", "director")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("prevents deleting non-salesperson or occupied position", async () => {
    vi.mocked(positionRepository.findPositionById).mockResolvedValueOnce({ type: "advisor" } as never);
    await expect(service.deleteSalespersonPosition("p1", "u1", "director")).rejects.toThrow(
      BadRequestError,
    );

    vi.mocked(positionRepository.findPositionById).mockResolvedValueOnce(
      { type: "salesperson", currentHolder: { toString: () => "u2" } } as never,
    );
    await expect(service.deleteSalespersonPosition("p2", "u1", "director")).rejects.toThrow(
      BadRequestError,
    );
  });

  it("prevents deleting position with active clients", async () => {
    vi.mocked(positionRepository.findPositionById).mockResolvedValue(
      { type: "salesperson", currentHolder: null, region: { toString: () => "r1" } } as never,
    );
    vi.mocked(Client.countDocuments).mockResolvedValue(2 as never);

    await expect(service.deleteSalespersonPosition("p1", "u1", "director")).rejects.toThrow(
      BadRequestError,
    );
  });

  it("deputy can delete own accessible empty position", async () => {
    vi.mocked(positionRepository.findPositionById)
      .mockResolvedValueOnce({
        _id: "p1",
        type: "salesperson",
        currentHolder: null,
        region: { toString: () => "region-1" },
      } as never)
      .mockResolvedValueOnce({ currentHolder: { toString: () => "deputy-user" } } as never);

    vi.mocked(Client.countDocuments).mockResolvedValue(0 as never);
    vi.mocked(regionRepository.findRegionById)
      .mockResolvedValueOnce({ _id: "region-1", parentRegion: { toString: () => "super-1" } } as never)
      .mockResolvedValueOnce({ _id: "super-1", deputy: { toString: () => "dep-pos-1" } } as never);

    await service.deleteSalespersonPosition("p1", "deputy-user", "deputy");
    expect(positionRepository.deletePositionById).toHaveBeenCalledWith("p1");
  });

  it("throws forbidden when deputy has no access", async () => {
    vi.mocked(positionRepository.findPositionById)
      .mockResolvedValueOnce({
        _id: "p1",
        type: "salesperson",
        currentHolder: null,
        region: { toString: () => "region-1" },
      } as never)
      .mockResolvedValueOnce({ currentHolder: { toString: () => "other-user" } } as never);
    vi.mocked(Client.countDocuments).mockResolvedValue(0 as never);
    vi.mocked(regionRepository.findRegionById)
      .mockResolvedValueOnce({ _id: "region-1", parentRegion: { toString: () => "super-1" } } as never)
      .mockResolvedValueOnce({ _id: "super-1", deputy: { toString: () => "dep-pos-1" } } as never);

    await expect(service.deleteSalespersonPosition("p1", "deputy-user", "deputy")).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("updates position code and checks access for deputy", async () => {
    vi.mocked(positionRepository.findPositionById)
      .mockResolvedValueOnce({ _id: "p1", region: { toString: () => "region-1" } } as never)
      .mockResolvedValueOnce({ currentHolder: { toString: () => "deputy-user" } } as never);
    vi.mocked(regionRepository.findRegionById)
      .mockResolvedValueOnce({ _id: "region-1", parentRegion: { toString: () => "super-1" } } as never)
      .mockResolvedValueOnce({ _id: "super-1", deputy: { toString: () => "dep-pos-1" } } as never);

    await service.updatePositionCode("p1", "new-1", "deputy-user", "deputy");
    expect(positionRepository.updatePositionCode).toHaveBeenCalledWith("p1", "new-1");
  });
});
