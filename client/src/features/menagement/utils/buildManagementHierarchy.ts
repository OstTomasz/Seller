import type { Region, PositionWithHolder } from "@/types";
import { SubRegionNode, SuperRegionNode } from "../types/menagement";

/** Builds a nested hierarchy from flat regions and positions arrays */
export const buildManagementHierarchy = (
  regions: Region[],
  positions: PositionWithHolder[],
): { directorPositions: PositionWithHolder[]; superRegions: SuperRegionNode[] } => {
  const directorPositions = positions.filter((p) => p.type === "director");
  const superregions = regions.filter((r) => r.parentRegion === null);
  const subregions = regions.filter((r) => r.parentRegion !== null);

  const superRegions: SuperRegionNode[] = superregions.map((sr) => {
    const deputyPosition =
      positions.find((p) => p.type === "deputy" && p.region?._id === sr._id) ?? null;

    const subs: SubRegionNode[] = subregions
      .filter((sub) => sub.parentRegion === sr._id)
      .map((sub) => ({
        region: sub,
        positions: positions.filter((p) => p.region?._id === sub._id),
      }));

    return { region: sr, deputyPosition, subRegions: subs };
  });

  return { directorPositions, superRegions };
};
