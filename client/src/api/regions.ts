import { api } from "@/lib/axios";
import type { Region } from "@/types";

export const regionsApi = {
  getAll: () => api.get<{ regions: Region[] }>("/regions"),
  updateName: (id: string, name: string) =>
    api.patch<{ region: Region }>(`/regions/${id}/name`, { name }),
  updateDeputy: (id: string, deputyId: string | null) =>
    api.patch<{ region: Region }>(`/regions/${id}/deputy`, { deputyId }),
  moveToParent: (id: string, newParentId: string) =>
    api.patch<{ region: Region }>(`/regions/${id}/parent`, { newParentId }),
  create: (name: string, prefix: string, parentRegionId?: string) =>
    api.post<{ region: Region }>("/regions", { name, prefix, parentRegionId }),
  delete: (id: string) => api.delete(`/regions/${id}`),
  updatePrefix: (id: string, prefix: string) =>
    api.patch<{ region: Region }>(`/regions/${id}/prefix`, { prefix }),
};
