import { api } from "@/lib/axios";
import type { ArchivedUser, User, UserForInvite } from "@/types";
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

  getMyProfile: () => api.get<UserWithProfile>("/users/me/profile"),
  updateMyProfile: (payload: {
    description?: string | null;
    workplace?: string | null;
    avatar?: string | null;
  }) => api.patch<UserWithProfile>("/users/me/profile", payload),

  updateUser: (
    id: string,
    payload: { positionId?: string | null; firstName?: string; lastName?: string; email?: string },
  ) => api.patch<{ user: User }>(`/users/${id}`, payload),

  toggleActive: (id: string) => api.patch<{ user: User }>(`/users/${id}/toggle-active`),

  createUser: (payload: {
    firstName: string;
    lastName: string;
    email: string;
    temporaryPassword: string;
    role: string;
    grade?: number | null;
    positionId?: string | null;
  }) => api.post<{ user: User }>("/users", payload),

  removeFromPosition: (id: string) => api.patch<{ user: User }>(`/users/${id}/remove-position`),

  archiveUser: (id: string, reason: string) =>
    api.patch<{ user: User }>(`/users/${id}/archive`, { reason }),

  getArchivedUsers: () => api.get<{ users: ArchivedUser[] }>("/users/archived"),

  addNote: (id: string, content: string) =>
    api.post<{ user: User }>(`/users/${id}/notes`, { content }),

  updateNote: (id: string, noteId: string, content: string) =>
    api.patch<{ user: User }>(`/users/${id}/notes/${noteId}`, { content }),

  deleteNote: (id: string, noteId: string) =>
    api.delete<{ user: User }>(`/users/${id}/notes/${noteId}`),
};
