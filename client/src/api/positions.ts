import { api } from "@/lib/axios";
import type { PositionWithHolder } from "@/types";

export const positionsApi = {
  getAll: () => api.get<{ positions: PositionWithHolder[] }>("/positions"),
  create: (regionId: string, code: string) =>
    api.post<{ position: PositionWithHolder }>("/positions", { regionId, code }),
  delete: (id: string) => api.delete(`/positions/${id}`),
};
