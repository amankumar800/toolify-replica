'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
  duration?: number; // Default: 5000ms
}

export interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

// ============================================
// Constants
// ============================================

const DEFAULT_DURATION = 5000; // 5 seconds per Requirements 15.7

const VARIANT_STYLES: Record<ToastVariant, { bg: string; icon: string; iconColor: string }> = {
  success: {
    bg: 'bg-green-500',
    icon: '✓',
    iconColor: 'text-white',
  },
  error: {
    bg: 'bg-red-500',
    icon: '✕',
    iconColor: 'text-white',
  },
  warning: {
    bg: 'bg-yellow-500',
    icon: '⚠',
    iconColor: 'text-white',
  },
  info: {
    bg: 'bg-blue-500',
    icon: 'ℹ',
    iconColor: 'text-white',
  },
};

// ============================================
// Context
// ============================================

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// ============================================
// Hook
// ============================================

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ============================================
// Toast Item Component
// ============================================

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const duration = toast.duration ?? DEFAULT_DURATION;
  const styles = VARIANT_STYLES[toast.variant];

  useEffect(() => {
    // Set up auto-dismiss timer per Requirements 15.7
    timerRef.current = setTimeout(() => {
      onRemove(toast.id);
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [toast.id, duration, onRemove]);

  // Handle immediate dismiss per Requirements 15.8
  const handleDismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    onRemove(toast.id);
  }, [toast.id, onRemove]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white min-w-[300px] max-w-[400px]',
        'toast-slide-in',
        styles.bg
      )}
    >
      {/* Icon */}
      <span className={cn('flex-shrink-0 text-lg font-bold', styles.iconColor)}>
        {styles.icon}
      </span>

      {/* Message */}
      <span className="flex-1 text-sm font-medium">{toast.message}</span>

      {/* Dismiss button - Requirements 15.8 */}
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors touch-target"
        aria-label="Dismiss notification"
      >
        <span className="text-lg leading-none">×</span>
      </button>
    </div>
  );
}


// ============================================
// Toast Container Component
// ============================================

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// ============================================
// Toast Provider Component
// ============================================

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// ============================================
// Convenience functions for creating toasts
// ============================================

export function createSuccessToast(message: string, duration?: number): Omit<Toast, 'id'> {
  return { variant: 'success', message, duration };
}

export function createErrorToast(message: string, duration?: number): Omit<Toast, 'id'> {
  return { variant: 'error', message, duration };
}

export function createWarningToast(message: string, duration?: number): Omit<Toast, 'id'> {
  return { variant: 'warning', message, duration };
}

export function createInfoToast(message: string, duration?: number): Omit<Toast, 'id'> {
  return { variant: 'info', message, duration };
}
