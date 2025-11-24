import React, { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import type { ToastMessage } from '@/types';

const ToastItem: React.FC<{ toast: ToastMessage }> = ({ toast }) => {
  const removeToast = useUIStore((state) => state.removeToast);

  useEffect(() => {
    const duration = toast.duration || 5000;
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, removeToast]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-soft ${getBgColor()} animate-slide-in-right`}
    >
      <div className="flex-shrink-0">{getIcon()}</div>
      <p className="text-sm text-gray-900 flex-1">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useUIStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

// Toast helper functions
export const toast = {
  success: (message: string, duration?: number) => {
    useUIStore.getState().addToast({ type: 'success', message, duration });
  },
  error: (message: string, duration?: number) => {
    useUIStore.getState().addToast({ type: 'error', message, duration });
  },
  warning: (message: string, duration?: number) => {
    useUIStore.getState().addToast({ type: 'warning', message, duration });
  },
  info: (message: string, duration?: number) => {
    useUIStore.getState().addToast({ type: 'info', message, duration });
  },
};
