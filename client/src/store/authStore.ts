import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "../types";
import { queryClient } from "@/lib/queryClient";

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  updateAuth: (token: string, updates: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,

      setAuth: (token, user) => {
        queryClient.clear();
        set({ token, user });
      },
      updateAuth: (token, updates) =>
        set((state) => ({
          token,
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      logout: () => {
        queryClient.clear();
        set({ token: null, user: null });
      },
    }),
    { name: "auth-storage" },
  ),
);
