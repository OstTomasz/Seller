import { useQuery } from "@tanstack/react-query";
import { regionsApi } from "@/api/regions";
import { positionsApi } from "@/api/positions";
import type { PositionWithHolder, Region } from "@/types";

interface SubRegionNode {
  region: Region;
  positions: PositionWithHolder[];
}

export interface CompanyHierarchyNode {
  directorPositions: PositionWithHolder[];
  superRegions: {
    region: Region;
    deputyPosition: PositionWithHolder | null;
    subRegions: SubRegionNode[];
  }[];
}

export const useCompanyStructure = () =>
  useQuery({
    queryKey: ["company-structure"],
    queryFn: async (): Promise<CompanyHierarchyNode> => {
      const [regRes, posRes] = await Promise.all([regionsApi.getAll(), positionsApi.getAll()]);
      const regions = regRes.data.regions;
      const positions = posRes.data.positions as PositionWithHolder[];

      const directorPositions = positions.filter((p) => p.type === "director");
      const superregions = regions.filter((r) => r.parentRegion === null);
      const subregions = regions.filter((r) => r.parentRegion !== null);

      const superRegions = superregions.map((sr) => ({
        region: sr,
        deputyPosition:
          positions.find((p) => p.type === "deputy" && p.region?._id === sr._id) ?? null,
        subRegions: subregions
          .filter((sub) => sub.parentRegion === sr._id)
          .map((sub) => ({
            region: sub,
            positions: positions.filter((p) => p.region?._id === sub._id && p.type !== "deputy"),
          })),
      }));

      return { directorPositions, superRegions };
    },
    staleTime: 5 * 60 * 1000,
  });
