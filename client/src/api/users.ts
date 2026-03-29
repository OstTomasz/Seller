import { api } from "@/lib/axios";
import type { User, UserForInvite } from "@/types";
import type { UserWithProfile } from "@/types";

export const usersApi = {
  getSalespersons: () => api.get<{ users: User[] }>("/users/salespersons"),

  getDetails: (id: string) => api.get<UserWithProfile>(`/users/${id}/details`),

  updateProfile: (
    id: string,
    payload: Partial<{
      phone: string | null;
      email: string | null;
      description: string | null;
      workplace: string | null;
      avatarIndex: number;
      hiredAt: string | null;
    }>,
  ) => api.patch<UserWithProfile>(`/users/${id}/profile`, payload),

  getAllForStructure: () => api.get<{ users: UserForInvite[] }>("/users/for-structure"),
};
