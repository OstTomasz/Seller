import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "../types";

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  updateAuth: (token: string, updates: Partial<User>) => void;
  logout: () => void;
}

// persist = automatically saves to localStorage
// so after page refresh user stays logged in
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,

      setAuth: (token, user) => set({ token, user }),

updateAuth: (token: string, updates: Partial<User>) =>
  set((state) => ({
    token,
    user: state.user ? { ...state.user, ...updates } : null,
  })),

      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "auth-storage", // localStorage key
    },
  ),
);
