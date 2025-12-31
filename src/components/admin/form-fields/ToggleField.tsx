'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from './TextField';

export interface ToggleFieldProps extends BaseFieldProps {
  value: boolean;
  onChange: (value: boolean) => void;
  onLabel?: string;
  offLabel?: string;
}

/**
 * ToggleField component for boolean values
 * 
 * Requirements: 13.2
 * - Toggle switch for boolean values
 * - Optional on/off labels
 * - Accessible with keyboard navigation
 * - Displays inline error messages
 */
export const ToggleField = React.forwardRef<HTMLButtonElement, ToggleFieldProps>(
  (
    {
      name,
      label,
      value,
      onChange,
      required = false,
      disabled = false,
      error,
      helpText,
      onLabel,
      offLabel,
    },
    ref
  ) => {
    const inputId = `field-${name}`;
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;

    const handleToggle = () => {
      if (!disabled) {
        onChange(!value);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
    };

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor={inputId}
            className={cn(
              'text-sm font-medium leading-none',
              disabled && 'opacity-70 cursor-not-allowed'
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {(onLabel || offLabel) && (
            <span className="text-xs text-gray-500">
              {value ? onLabel : offLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            ref={ref}
            id={inputId}
            type="button"
            role="switch"
            aria-checked={value}
            aria-invalid={!!error}
            aria-describedby={cn(error && errorId, helpText && helpId)}
            disabled={disabled}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
              'transition-colors duration-200 ease-in-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              // Ensure minimum touch target
              'min-h-[44px] min-w-[44px] p-[10px]',
              value ? 'bg-blue-600' : 'bg-gray-200',
              error && 'ring-2 ring-red-500'
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0',
                'transition duration-200 ease-in-out',
                value ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
          {offLabel && onLabel && (
            <span className="text-sm text-gray-600">
              {value ? onLabel : offLabel}
            </span>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={helpId} className="text-xs text-gray-500">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

ToggleField.displayName = 'ToggleField';
