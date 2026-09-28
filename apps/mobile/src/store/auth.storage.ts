// create a global auth system like i want to access the auth anywhere in my files means at any level of route after login.



// import type { User } from "@/api/auth/auth.types";
// import { authStorage } from "@/auth/auth.storage";
// import { create } from "zustand";

// interface AuthState {
//   user: User | null;
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   setUser: (user: User | null) => void;
//   setLoading: (isLoading: boolean) => void;
//   setAuthenticatedUser: (
//     user: User,
//     accessToken: string,
//     refreshToken: string,
//   ) => Promise<void>;
//   logout: () => Promise<void>;
// }

// export const useAuthStore = create<AuthState>((set) => ({
//   user: null,
//   isAuthenticated: false,
//   isLoading: true,

//   setUser: (user) => set({ user, isAuthenticated: user !== null }),
//   setLoading: (isLoading) => set({ isLoading }),

//   setAuthenticatedUser: async (user, accessToken, refreshToken) => {
//     await authStorage.setTokens(accessToken, refreshToken);
//     set({ user, isAuthenticated: true });
//   },

//   logout: async () => {
//     await authStorage.clearTokens();
//     set({ user: null, isAuthenticated: false });
//   },
// }));


// this is my other project store