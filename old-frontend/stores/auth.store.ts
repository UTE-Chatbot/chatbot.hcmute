import { api } from "@/lib/api";
import { getUserProfile, logout as logoutApi } from "@/services/auth.service";
import { create } from "zustand";

type User = {
  id: string;
  email: string;
  full_name: string;
  avatar?: string;
  role: string;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;

  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  fetchUser: async () => {
    try {
      const res = await getUserProfile();
      set({
        user: res,
        loading: false,
        error: null,
      });
    } catch (err) {
      set({
        user: null,
        loading: false,
        error: null,
      });
    }
  },
  logout: async () => {
    try {
      await logoutApi();
    } catch (_) {}

    set({ user: null });
  },

  setUser: (user) => set({ user }),
}));
