'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FormLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export interface FormRowProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'between';
}

/**
 * FormLayout - Main container for admin forms
 * 
 * Requirements: 22.3, 22.6
 * - Responsive layout that stacks fields vertically on viewport < 640px
 * - Ensures touch targets are at least 44x44px
 */
export function FormLayout({ children, className }: FormLayoutProps) {
  return (
    <div
      className={cn(
        'space-y-6 max-w-4xl',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * FormSection - Groups related form fields with optional title
 */
export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm',
        className
      )}
    >
      {(title || description) && (
        <div className="px-4 py-3 sm:px-6 border-b border-gray-200">
          {title && (
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
      )}
      <div className="px-4 py-4 sm:px-6 space-y-4">
        {children}
      </div>
    </div>
  );
}

/**
 * FormRow - Responsive row for form fields
 * 
 * Requirements: 22.3
 * - Stacks fields vertically on viewport < 640px
 * - Supports 1-4 column layouts on larger screens
 */
export function FormRow({ children, columns = 2, className }: FormRowProps) {
  const gridCols = {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
  }[columns];

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4',
        gridCols,
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * FormActions - Container for form action buttons
 * 
 * Requirements: 22.6
 * - Ensures buttons have minimum touch target size
 * - Responsive alignment
 */
export function FormActions({ children, className, align = 'right' }: FormActionsProps) {
  const alignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  }[align];

  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row gap-3 pt-4',
        alignClass,
        // Ensure buttons stack on mobile
        '[&>button]:w-full [&>button]:sm:w-auto',
        // Ensure minimum touch target size
        '[&>button]:min-h-[44px]',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * FormDivider - Visual separator between form sections
 */
export function FormDivider({ className }: { className?: string }) {
  return (
    <hr className={cn('border-t border-gray-200 my-6', className)} />
  );
}

/**
 * ReadOnlyField - Display read-only data in forms
 */
export interface ReadOnlyFieldProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function ReadOnlyField({ label, value, className }: ReadOnlyFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-sm font-medium text-gray-500">{label}</label>
      <div className="text-sm text-gray-900 bg-gray-50 rounded-md px-3 py-2 min-h-[44px] flex items-center">
        {value ?? <span className="text-gray-400">—</span>}
      </div>
    </div>
  );
}

FormLayout.displayName = 'FormLayout';
FormSection.displayName = 'FormSection';
FormRow.displayName = 'FormRow';
FormActions.displayName = 'FormActions';
FormDivider.displayName = 'FormDivider';
ReadOnlyField.displayName = 'ReadOnlyField';
