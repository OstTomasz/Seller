import { api } from "@/lib/axios";
import type { IPositionHistory, PositionWithHolder } from "@/types";

export const positionsApi = {
  getAll: () => api.get<{ positions: PositionWithHolder[] }>("/positions"),
  create: (regionId: string, code: string) =>
    api.post<{ position: PositionWithHolder }>("/positions", { regionId, code }),
  delete: (id: string) => api.delete(`/positions/${id}`),
  updateCode: (id: string, code: string) =>
    api.patch<{ position: PositionWithHolder }>(`/positions/${id}/code`, { code }),

  getHistory: (id: string) => api.get<{ history: IPositionHistory[] }>(`/positions/${id}/history`),
};
