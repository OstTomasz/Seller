import { api } from "@/lib/axios";
import type { User } from "@/types";

export const usersApi = {
  getSalespersons: () => api.get<{ users: User[] }>("/users/salespersons"),
};
