'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

// ============================================
// Types
// ============================================

/**
 * Represents a related record that will be affected by the delete operation
 */
export interface AffectedRecord {
  /** Type/category of the affected records (e.g., "subcategories", "tool_categories") */
  type: string;
  /** Number of affected records */
  count: number;
  /** Optional list of affected item names/identifiers */
  items?: string[];
}

/**
 * Props for the DeleteModal component
 */
export interface DeleteModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Handler called when the modal should close */
  onClose: () => void;
  /** Handler called when the delete is confirmed */
  onConfirm: () => void;
  /** Title for the modal (e.g., "Delete Tool") */
  title: string;
  /** Name/identifier of the record being deleted */
  recordName: string;
  /** List of related records that will be affected by the delete */
  affectedRecords?: AffectedRecord[];
  /** Whether to require typing "DELETE" to confirm (for critical operations) */
  requireConfirmation?: boolean;
  /** Whether the delete operation is in progress */
  isLoading?: boolean;
}

// ============================================
// Constants
// ============================================

const CONFIRMATION_TEXT = 'DELETE';

// ============================================
// DeleteModal Component
// ============================================

/**
 * DeleteModal Component
 * 
 * A modal dialog for confirming delete operations with support for:
 * - Displaying the record name/identifier
 * - Showing affected related records (cascade deletes)
 * - Requiring typing "DELETE" for critical operations
 * - Cancel and Confirm buttons
 * - Loading state during delete operation
 * 
 * Requirements:
 * - 13.3: Delete_Modal component features
 */
export function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  recordName,
  affectedRecords = [],
  requireConfirmation = false,
  isLoading = false,
}: DeleteModalProps) {
  // ============================================
  // State
  // ============================================
  
  const [confirmationInput, setConfirmationInput] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // Effects
  // ============================================

  // Reset confirmation input when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmationInput('');
      // Focus the input if confirmation is required
      if (requireConfirmation) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, requireConfirmation]);

  // Handle escape key to close modal
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ============================================
  // Handlers
  // ============================================

  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget && !isLoading) {
      onClose();
    }
  }, [isLoading, onClose]);

  const handleConfirm = useCallback(() => {
    if (requireConfirmation && confirmationInput !== CONFIRMATION_TEXT) {
      return;
    }
    onConfirm();
  }, [requireConfirmation, confirmationInput, onConfirm]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmationInput(event.target.value);
  }, []);

  // ============================================
  // Computed values
  // ============================================

  const isConfirmDisabled = requireConfirmation && confirmationInput !== CONFIRMATION_TEXT;
  const hasAffectedRecords = affectedRecords.length > 0;
  const totalAffectedCount = affectedRecords.reduce((sum, record) => sum + record.count, 0);

  // ============================================
  // Render
  // ============================================

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 id="delete-modal-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-target"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Record name display */}
          <p className="text-gray-700">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-gray-900">&quot;{recordName}&quot;</span>?
          </p>

          {/* Affected records warning */}
          {hasAffectedRecords && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-800 mb-2">
                This action will also affect {totalAffectedCount} related record{totalAffectedCount !== 1 ? 's' : ''}:
              </p>
              <ul className="space-y-2">
                {affectedRecords.map((record, index) => (
                  <li key={index} className="text-sm text-amber-700">
                    <span className="font-medium">{record.count}</span> {record.type}
                    {record.items && record.items.length > 0 && (
                      <ul className="mt-1 ml-4 text-xs text-amber-600">
                        {record.items.slice(0, 5).map((item, itemIndex) => (
                          <li key={itemIndex} className="truncate">• {item}</li>
                        ))}
                        {record.items.length > 5 && (
                          <li className="italic">...and {record.items.length - 5} more</li>
                        )}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Confirmation input for critical operations */}
          {requireConfirmation && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                To confirm this action, please type{' '}
                <span className="font-mono font-semibold text-red-600">{CONFIRMATION_TEXT}</span>{' '}
                below:
              </p>
              <Input
                ref={inputRef}
                type="text"
                value={confirmationInput}
                onChange={handleInputChange}
                placeholder={`Type ${CONFIRMATION_TEXT} to confirm`}
                disabled={isLoading}
                className={cn(
                  'font-mono',
                  confirmationInput === CONFIRMATION_TEXT && 'border-green-500 focus:ring-green-500/20'
                )}
                aria-label="Confirmation input"
              />
            </div>
          )}

          {/* Warning message */}
          <p className="text-sm text-gray-500">
            This action cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isConfirmDisabled || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
