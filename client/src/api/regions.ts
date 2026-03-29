import { api } from "@/lib/axios";
import type { Region } from "@/types";

export const regionsApi = {
  getAll: () => api.get<{ regions: Region[] }>("/regions"),
};
