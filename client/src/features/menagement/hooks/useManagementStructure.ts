import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { regionsApi } from "@/api/regions";
import { usersApi } from "@/api/users";
import { positionsApi } from "@/api/positions";
import { buildHierarchy } from "@/features/users/utils/buildHierarchy";
import type { UserForInvite } from "@/types";

export const useManagementStructure = () => {
  const regions = useQuery({
    queryKey: ["management-regions"],
    queryFn: () => regionsApi.getAll().then((r) => r.data.regions),
  });

  const users = useQuery({
    queryKey: ["management-users"],
    queryFn: () =>
      usersApi.getAllForStructure().then((r) => buildHierarchy(r.data.users as UserForInvite[])),
  });

  return { regions, users };
};

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["management-regions"] });
  qc.invalidateQueries({ queryKey: ["management-users"] });
  qc.invalidateQueries({ queryKey: ["company-structure"] });
  qc.invalidateQueries({ queryKey: ["all-positions"] });
  qc.invalidateQueries({ queryKey: ["all-users"] });
  qc.invalidateQueries({ queryKey: ["users-without-position"] });
};

export const useUpdateRegionName = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => regionsApi.updateName(id, name),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useUpdateDeputy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, deputyId }: { id: string; deputyId: string | null }) =>
      regionsApi.updateDeputy(id, deputyId),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useMoveRegion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newParentId }: { id: string; newParentId: string }) =>
      regionsApi.moveToParent(id, newParentId),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useCreateRegion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      prefix,
      parentRegionId,
    }: {
      name: string;
      prefix: string;
      parentRegionId?: string;
    }) => regionsApi.create(name, prefix, parentRegionId),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useCreatePosition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ regionId, code }: { regionId: string; code: string }) =>
      positionsApi.create(regionId, code),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useDeletePosition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => positionsApi.delete(id),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useAssignUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, positionId }: { userId: string; positionId: string | null }) =>
      usersApi.updateUser(userId, { positionId }),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => invalidateAll(qc),
  });
};

export const useAllPositions = () =>
  useQuery({
    queryKey: ["all-positions"],
    queryFn: () => positionsApi.getAll().then((r) => r.data.positions),
  });

export const useRemoveFromPosition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => usersApi.removeFromPosition(userId),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useUsersWithoutPosition = () =>
  useQuery({
    queryKey: ["users-without-position"],
    queryFn: () =>
      usersApi
        .getAllForStructure()
        .then((r) => (r.data.users as UserForInvite[]).filter((u) => !u.position && u.isActive)),
  });
