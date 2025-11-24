import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  userId: string | null;
  email: string | null;
  name: string | null;
  role: 'Admin' | 'Client' | null;
  isLoggedIn: boolean;

  // Actions
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      email: null,
      name: null,
      role: null,
      isLoggedIn: false,

      login: (user: User) => set({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'Client',
        isLoggedIn: true,
      }),

      logout: () => set({
        userId: null,
        email: null,
        name: null,
        role: null,
        isLoggedIn: false,
      }),

      updateUser: (client: Partial<User>) => set((state) => ({
        userId: client.id ?? state.userId,
        email: client.email ?? state.email,
        name: client.name ?? state.name,
        role: client.role ?? state.role,
      })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        userId: state.userId,
        email: state.email,
        name: state.name,
        role: state.role,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);
