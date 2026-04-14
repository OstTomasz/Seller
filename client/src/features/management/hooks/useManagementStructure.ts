import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { regionsApi } from "@/api/regions";
import { usersApi } from "@/api/users";
import { positionsApi } from "@/api/positions";
import { buildHierarchy } from "@/features/users/utils/buildHierarchy";
import type { UserForInvite } from "@/types";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";

export const useManagementStructure = () => {
  const regions = useQuery({
    queryKey: queryKeys.management.regions(),
    queryFn: () => regionsApi.getAll().then((r) => r.data.regions),
  });

  const users = useQuery({
    queryKey: queryKeys.management.users(),
    queryFn: () =>
      usersApi.getAllForStructure().then((r) => buildHierarchy(r.data.users as UserForInvite[])),
  });

  return { regions, users };
};

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: queryKeys.management.regions() });
  qc.invalidateQueries({ queryKey: queryKeys.management.users() });
  qc.invalidateQueries({ queryKey: queryKeys.management.companyStructure() });
  qc.invalidateQueries({ queryKey: queryKeys.management.allPositions() });
  qc.invalidateQueries({ queryKey: queryKeys.management.allUsers() });
  qc.invalidateQueries({ queryKey: queryKeys.management.usersWithoutPosition() });
};

export const useUpdateRegionName = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => regionsApi.updateName(id, name),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useUpdateRegionPrefix = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, prefix }: { id: string; prefix: string }) =>
      regionsApi.updatePrefix(id, prefix),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.management.regions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.management.companyStructure() });
      toast.success("Region prefix updated.");
    },
    onError: () => toast.error("Failed to update prefix."),
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
    queryKey: queryKeys.management.allPositions(),
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
    queryKey: queryKeys.management.usersWithoutPosition(),
    queryFn: () =>
      usersApi
        .getAllForStructure()
        .then((r) => (r.data.users as UserForInvite[]).filter((u) => !u.position && u.isActive)),
  });

/** Mutation for deleting a region. Invalidates management structure. */
export const useDeleteRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => regionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.management.regions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.management.companyStructure() });
      toast.success("Region deleted.");
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Failed to delete region.");
    },
  });
};

export const useUpdatePositionCode = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, code }: { id: string; code: string }) => positionsApi.updateCode(id, code),
    onSuccess: () => invalidateAll(qc),
  });
};
