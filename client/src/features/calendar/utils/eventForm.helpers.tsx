import type { Client, UserForInvite } from "@/types";
import type { ReactNode } from "react";

export const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <span className="min-h-4 text-xs text-red-400">{message}</span>
  ) : (
    <span className="min-h-4" />
  );

export const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h3 className="text-xs font-semibold text-celery-500 uppercase tracking-wider mb-3">{children}</h3>
);

interface PopulatedPosition {
  _id: string;
  currentHolder?: { _id: string };
  region?: {
    _id: string;
    parentRegion?: { _id: string; name?: string } | null;
  };
}

export const getRelevantUserIds = (
  client: Client,
  allUsers: UserForInvite[],
  excludeUserId?: string,
): string[] => {
  const ids = new Set<string>();
  const assignedTo = client.assignedTo as unknown as PopulatedPosition;
  const assignedAdvisor = client.assignedAdvisor as unknown as PopulatedPosition | null;

  if (assignedTo?.currentHolder?._id) ids.add(assignedTo.currentHolder._id);
  if (assignedAdvisor?.currentHolder?._id) ids.add(assignedAdvisor.currentHolder._id);

  const parentRegion = assignedTo?.region?.parentRegion;
  const superRegionId =
    parentRegion != null && typeof parentRegion === "object" ? parentRegion._id : undefined;

  if (superRegionId) {
    allUsers
      .filter((u) => {
        const region = u.position?.region;
        if (!region) return false;
        return region.parentRegion === null && region._id.toString() === superRegionId;
      })
      .forEach((u) => ids.add(u._id));
  }

  allUsers.filter((u) => !u.position?.region).forEach((u) => ids.add(u._id));
  if (excludeUserId) ids.delete(excludeUserId);
  return [...ids];
};

export const getUserName = (id: string, allUsers: UserForInvite[]): string => {
  const user = allUsers.find((candidate) => candidate._id === id);
  return user ? `${user.firstName} ${user.lastName}` : id;
};
