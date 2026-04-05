import type { Region, PositionWithHolder } from "@/types";

export interface SubRegionNode {
  region: Region;
  positions: PositionWithHolder[];
}

export interface SuperRegionNode {
  region: Region;
  deputyPosition: PositionWithHolder | null;
  subRegions: SubRegionNode[];
}
