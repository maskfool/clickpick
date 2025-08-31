import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authAPI } from "../services/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar?: string | null;
  preferences: {
    theme: "light" | "dark";
    language: string;
  };
  stats: {
    thumbnailsCreated: number;
    imagesGenerated: number;
    totalUsage: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ✅ LOGIN
      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null });
          const res = await authAPI.login({ email, password });

          // ✅ backend returns { token, user } not res.data.data
          const { token, user } = res.data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (err: any) {
          set({
            isLoading: false,
            error: err.response?.data?.error || "Login failed",
          });
          throw err;
        }
      },

      // ✅ REGISTER
      register: async (name, email, password) => {
        try {
          set({ isLoading: true, error: null });
          const res = await authAPI.register({ name, email, password });

          const { token, user } = res.data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (err: any) {
          set({
            isLoading: false,
            error: err.response?.data?.error || "Registration failed",
          });
          throw err;
        }
      },

      // ✅ LOGOUT
      logout: async () => {
        try {
          await authAPI.logout();
        } catch {
          /* ignore */
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
        localStorage.removeItem("auth-storage");
      },

      // ✅ CHECK AUTH
      checkAuth: async () => {
        try {
          set({ isLoading: true });
          const token = get().token;
          if (!token) {
            set({ isLoading: false, isAuthenticated: false });
            return;
          }

          const res = await authAPI.getMe();

          // ✅ backend returns { user }
          const { user } = res.data;

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      // ✅ UPDATE PROFILE
      updateProfile: async (data) => {
        try {
          set({ isLoading: true, error: null });
          const res = await authAPI.updateProfile(data);

          const { user } = res.data;

          set({
            user,
            isLoading: false,
            error: null,
          });
        } catch (err: any) {
          set({
            isLoading: false,
            error: err.response?.data?.error || "Profile update failed",
          });
          throw err;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);