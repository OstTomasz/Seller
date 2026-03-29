import type { UserForInvite } from "@/types";

export interface SubRegionNode {
  id: string;
  name: string;
  prefix: string;
  users: UserForInvite[];
}

export interface SuperRegionNode {
  id: string | null;
  name: string;
  prefix: string;
  users: UserForInvite[];
  subRegions: SubRegionNode[];
}

export interface HierarchyNode {
  directors: UserForInvite[];
  superRegions: SuperRegionNode[];
}

export const buildHierarchy = (users: UserForInvite[], excludeId?: string): HierarchyNode => {
  const filtered = excludeId ? users.filter((u) => u._id !== excludeId) : users;
  const directors = filtered.filter((u) => !u.position?.region);

  const superRegionMap = new Map<string, SuperRegionNode>();
  const subRegionMap = new Map<string, SubRegionNode>();

  users
    .filter((u) => u.position?.region && u.position.region.parentRegion === null)
    .forEach((u) => {
      const region = u.position!.region!;
      if (!superRegionMap.has(region._id)) {
        superRegionMap.set(region._id, {
          id: region._id,
          name: region.name,
          prefix: region.prefix,
          users: [],
          subRegions: [],
        });
      }
      if (!excludeId || u._id !== excludeId) {
        superRegionMap.get(region._id)!.users.push(u);
      }
    });

  filtered
    .filter((u) => u.position?.region && u.position.region.parentRegion !== null)
    .forEach((u) => {
      const region = u.position!.region!;
      if (!subRegionMap.has(region._id)) {
        subRegionMap.set(region._id, {
          id: region._id,
          name: region.name,
          prefix: region.prefix,
          users: [],
        });
      }
      subRegionMap.get(region._id)!.users.push(u);
    });

  subRegionMap.forEach((subRegion) => {
    const sampleUser = users.find((u) => u.position?.region?._id === subRegion.id);
    const parentRegion = sampleUser?.position?.region?.parentRegion;
    const parentId =
      parentRegion && typeof parentRegion === "object" ? parentRegion._id : parentRegion;
    if (parentId && superRegionMap.has(parentId)) {
      superRegionMap.get(parentId)!.subRegions.push(subRegion);
    }
  });

  superRegionMap.forEach((sr) => {
    sr.subRegions.sort((a, b) => a.name.localeCompare(b.name));
    sr.users.sort((a, b) => a.lastName.localeCompare(b.lastName));
  });

  return {
    directors,
    superRegions: Array.from(superRegionMap.values())
      .filter((sr) => sr.users.length > 0 || sr.subRegions.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
};

export const matchesSearch = (user: UserForInvite, q: string): boolean =>
  user.firstName.toLowerCase().includes(q) ||
  user.lastName.toLowerCase().includes(q) ||
  String(user.numericId).includes(q) ||
  (user.position?.code.toLowerCase().includes(q) ?? false);
