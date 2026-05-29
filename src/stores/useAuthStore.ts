import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { supabase } from "@/lib/supabase";
import { DEMO_AGENCY_ID, isLocalDemoMode } from "@/constants/demoMode";
import {
  logout as supabaseSignOut,
  requestEmailOtp,
  signInWithEmail,
  signUpClient,
  validateSession,
  verifyEmailOtp,
  type AuthUser,
} from "@/services/authService";

export class WrongAppError extends Error {
  constructor() {
    super(
      "This account belongs to an agency. Please use the MyFleet agency app to sign in.",
    );
    this.name = "WrongAppError";
  }
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
}

interface AuthActions {
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  requestOtp: (email: string) => Promise<void>;
  loginWithOtp: (email: string, token: string) => Promise<void>;
  signup: (input: {
    name: string;
    email: string;
    phone?: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  startDemoSession: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

type AuthStore = AuthState & AuthActions;

const DEMO_USER: AuthUser = {
  id: "demo-client",
  name: "Demo Client",
  email: "demo@myfleet.local",
  role: "client",
  agencyId: DEMO_AGENCY_ID,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,

      initialize: async () => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error || !data.session) {
            set({ isLoading: false, isHydrated: true });
            return;
          }

          const user = await validateSession(data.session.access_token);
          if (user.role !== "client") {
            await supabase.auth.signOut();
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              isHydrated: true,
            });
            return;
          }
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            isHydrated: true,
          });
        } catch {
          await supabase.auth.signOut();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isHydrated: true,
          });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const session = await signInWithEmail(
            email.trim().toLowerCase(),
            password,
          );
          const user = await validateSession(session.accessToken);
          if (user.role !== "client") {
            await supabaseSignOut();
            set({ isLoading: false });
            throw new WrongAppError();
          }
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      requestOtp: async (email) => {
        await requestEmailOtp(email.trim().toLowerCase());
      },

      loginWithOtp: async (email, token) => {
        set({ isLoading: true });
        try {
          const session = await verifyEmailOtp(
            email.trim().toLowerCase(),
            token.trim(),
          );
          const user = await validateSession(session.accessToken);
          if (user.role !== "client") {
            await supabaseSignOut();
            set({ isLoading: false });
            throw new WrongAppError();
          }
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async ({ name, email, phone, password }) => {
        set({ isLoading: true });
        try {
          const normalizedEmail = email.trim().toLowerCase();
          await signUpClient({
            name: name.trim(),
            email: normalizedEmail,
            phone: phone?.trim() || undefined,
            password,
          });
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        await supabaseSignOut();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      startDemoSession: () => {
        if (!isLocalDemoMode) return;
        set({
          user: DEMO_USER,
          isAuthenticated: true,
          isLoading: false,
          isHydrated: true,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: "my-fleet-client-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
