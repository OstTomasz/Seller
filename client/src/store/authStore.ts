import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "../types";

interface AuthState {
  token: string | null;
  user: User | null;
  // actions
  setAuth: (token: string, user: User) => void;
  updateToken: (token: string) => void;
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

      updateToken: (token) => set((state) => ({ ...state, token })),

      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "auth-storage", // localStorage key
    },
  ),
);
