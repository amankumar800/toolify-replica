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

export interface UnsavedChangesContextValue {
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Set the unsaved changes state */
  setHasUnsavedChanges: (value: boolean) => void;
  /** Check if navigation should proceed, shows dialog if there are unsaved changes */
  confirmNavigation: () => Promise<boolean>;
  /** Register a form with unsaved changes tracking */
  registerForm: (formId: string) => void;
  /** Unregister a form */
  unregisterForm: (formId: string) => void;
  /** Mark a specific form as dirty */
  markFormDirty: (formId: string, isDirty: boolean) => void;
}

// ============================================
// Context
// ============================================

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | undefined>(undefined);

// ============================================
// Hook
// ============================================

/**
 * Hook to access unsaved changes context
 * 
 * Usage in forms:
 * ```tsx
 * const { setHasUnsavedChanges } = useUnsavedChanges();
 * 
 * // When form becomes dirty
 * useEffect(() => {
 *   setHasUnsavedChanges(isDirty);
 * }, [isDirty, setHasUnsavedChanges]);
 * ```
 */
export function useUnsavedChanges(): UnsavedChangesContextValue {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error('useUnsavedChanges must be used within an UnsavedChangesProvider');
  }
  return context;
}

// ============================================
// Confirmation Dialog Component
// ============================================

interface ConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationDialog({ isOpen, onConfirm, onCancel }: ConfirmationDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button when dialog opens
  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-title"
      aria-describedby="unsaved-changes-description"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2
          id="unsaved-changes-title"
          className="text-lg font-semibold text-gray-900 mb-2"
        >
          Unsaved Changes
        </h2>
        <p
          id="unsaved-changes-description"
          className="text-gray-600 mb-6"
        >
          You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.
        </p>

        <div className="flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className={cn(
              'px-4 py-2 rounded-lg font-medium',
              'bg-gray-100 text-gray-700 hover:bg-gray-200',
              'transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500'
            )}
          >
            Stay on Page
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              'px-4 py-2 rounded-lg font-medium',
              'bg-red-600 text-white hover:bg-red-700',
              'transition-colors focus:outline-none focus:ring-2 focus:ring-red-500'
            )}
          >
            Leave Page
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Provider Component
// ============================================

interface UnsavedChangesProviderProps {
  children: React.ReactNode;
}

/**
 * UnsavedChangesProvider Component
 * 
 * Provides unsaved changes tracking and warning functionality for admin forms.
 * 
 * Requirements:
 * - 13.5: Display warning dialog when admin attempts to navigate away with unsaved changes
 * 
 * Features:
 * - Tracks dirty state across multiple forms
 * - Shows browser's native beforeunload dialog for browser close/refresh
 * - Provides confirmation dialog for programmatic navigation checks
 */
export function UnsavedChangesProvider({ children }: UnsavedChangesProviderProps) {
  const [dirtyForms, setDirtyForms] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  // Computed hasUnsavedChanges
  const hasUnsavedChanges = dirtyForms.size > 0;

  // Set unsaved changes state (simple boolean API)
  const setHasUnsavedChanges = useCallback((value: boolean) => {
    setDirtyForms((prev) => {
      const next = new Set(prev);
      if (value) {
        next.add('default');
      } else {
        next.delete('default');
      }
      return next;
    });
  }, []);

  // Register a form for tracking
  const registerForm = useCallback((formId: string) => {
    // No-op, forms are tracked when marked dirty
  }, []);

  // Unregister a form
  const unregisterForm = useCallback((formId: string) => {
    setDirtyForms((prev) => {
      const next = new Set(prev);
      next.delete(formId);
      return next;
    });
  }, []);

  // Mark a specific form as dirty
  const markFormDirty = useCallback((formId: string, isDirty: boolean) => {
    setDirtyForms((prev) => {
      const next = new Set(prev);
      if (isDirty) {
        next.add(formId);
      } else {
        next.delete(formId);
      }
      return next;
    });
  }, []);

  // Confirm navigation - shows dialog if there are unsaved changes
  const confirmNavigation = useCallback((): Promise<boolean> => {
    if (!hasUnsavedChanges) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setIsDialogOpen(true);
    });
  }, [hasUnsavedChanges]);

  // Handle dialog confirm
  const handleDialogConfirm = useCallback(() => {
    setIsDialogOpen(false);
    setDirtyForms(new Set()); // Clear all dirty forms
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  // Handle dialog cancel
  const handleDialogCancel = useCallback(() => {
    setIsDialogOpen(false);
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  // Handle browser beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Modern browsers ignore custom messages, but we still need to set returnValue
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const value: UnsavedChangesContextValue = {
    hasUnsavedChanges,
    setHasUnsavedChanges,
    confirmNavigation,
    registerForm,
    unregisterForm,
    markFormDirty,
  };

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
      <ConfirmationDialog
        isOpen={isDialogOpen}
        onConfirm={handleDialogConfirm}
        onCancel={handleDialogCancel}
      />
    </UnsavedChangesContext.Provider>
  );
}

// ============================================
// Utility Hook for Form Integration
// ============================================

/**
 * Hook for easy form integration with unsaved changes tracking
 * 
 * Usage:
 * ```tsx
 * const { markDirty, markClean } = useFormUnsavedChanges('my-form');
 * 
 * // When form changes
 * markDirty();
 * 
 * // After successful save
 * markClean();
 * ```
 */
export function useFormUnsavedChanges(formId: string) {
  const { markFormDirty, unregisterForm } = useUnsavedChanges();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unregisterForm(formId);
    };
  }, [formId, unregisterForm]);

  const markDirty = useCallback(() => {
    markFormDirty(formId, true);
  }, [formId, markFormDirty]);

  const markClean = useCallback(() => {
    markFormDirty(formId, false);
  }, [formId, markFormDirty]);

  return { markDirty, markClean };
}
