import { create } from 'zustand';
import type { ToastMessage, ModalState } from '@/types';

interface UIState {
  // Global loader
  isLoading: boolean;
  loadingMessage: string | null;

  // Toast messages
  toasts: ToastMessage[];

  // Modal state
  modal: ModalState;

  // Actions
  setLoading: (isLoading: boolean, message?: string) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  openModal: (type: string, data?: any) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLoading: false,
  loadingMessage: null,
  toasts: [],
  modal: { isOpen: false },

  setLoading: (isLoading, message = null) => set({
    isLoading,
    loadingMessage: message,
  }),

  addToast: (toast) => set((state) => ({
    toasts: [
      ...state.toasts,
      {
        ...toast,
        id: Math.random().toString(36).substring(7),
      },
    ],
  })),

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),

  clearToasts: () => set({ toasts: [] }),

  openModal: (type, data) => set({
    modal: { isOpen: true, type, data },
  }),

  closeModal: () => set({
    modal: { isOpen: false, type: undefined, data: undefined },
  }),
}));
