'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from './TextField';
import type { SelectOption } from './SelectField';

export interface MultiSelectFieldProps extends BaseFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  maxSelections?: number;
}

/**
 * MultiSelectField component for selecting multiple options
 * 
 * Requirements: 13.2
 * - Multiple selection with checkboxes
 * - Shows selected items as tags
 * - Supports max selections limit
 * - Displays inline error messages
 */
export const MultiSelectField = React.forwardRef<HTMLDivElement, MultiSelectFieldProps>(
  (
    {
      name,
      label,
      value,
      onChange,
      options,
      placeholder = 'Select options',
      required = false,
      disabled = false,
      error,
      helpText,
      maxSelections,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const inputId = `field-${name}`;
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (optionValue: string) => {
      if (disabled) return;
      
      const isSelected = value.includes(optionValue);
      if (isSelected) {
        onChange(value.filter((v) => v !== optionValue));
      } else {
        if (maxSelections && value.length >= maxSelections) return;
        onChange([...value, optionValue]);
      }
    };

    const removeOption = (optionValue: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;
      onChange(value.filter((v) => v !== optionValue));
    };

    const selectedLabels = value
      .map((v) => options.find((o) => o.value === v)?.label)
      .filter(Boolean);

    const canSelectMore = !maxSelections || value.length < maxSelections;

    return (
      <div className="space-y-1.5" ref={ref}>
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
          {maxSelections && (
            <span className="text-xs text-gray-500">
              {value.length}/{maxSelections}
            </span>
          )}
        </div>
        <div ref={containerRef} className="relative">
          <div
            id={inputId}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-invalid={!!error}
            aria-describedby={cn(error && errorId, helpText && helpId)}
            tabIndex={disabled ? -1 : 0}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                !disabled && setIsOpen(!isOpen);
              }
              if (e.key === 'Escape') {
                setIsOpen(false);
              }
            }}
            className={cn(
              'flex min-h-[44px] w-full rounded-md border bg-background px-3 py-2 text-sm',
              'ring-offset-background cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              disabled && 'cursor-not-allowed opacity-50',
              error
                ? 'border-red-500 focus-visible:ring-red-500'
                : 'border-[var(--input)]'
            )}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {selectedLabels.length > 0 ? (
                selectedLabels.map((labelText, index) => (
                  <span
                    key={value[index]}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs"
                  >
                    {labelText}
                    <button
                      type="button"
                      onClick={(e) => removeOption(value[index], e)}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                      aria-label={`Remove ${labelText}`}
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <div className="flex items-center pl-2">
              <svg
                className={cn('h-4 w-4 text-gray-500 transition-transform', isOpen && 'rotate-180')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {isOpen && (
            <div
              role="listbox"
              aria-multiselectable="true"
              className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto"
            >
              {options.map((option) => {
                const isSelected = value.includes(option.value);
                const isDisabledOption = option.disabled || (!isSelected && !canSelectMore);
                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabledOption}
                    onClick={() => !isDisabledOption && toggleOption(option.value)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 cursor-pointer min-h-[44px]',
                      isSelected && 'bg-blue-50',
                      isDisabledOption ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                    )}
                  >
                    <div
                      className={cn(
                        'h-4 w-4 rounded border flex items-center justify-center',
                        isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                      )}
                    >
                      {isSelected && (
                        <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm">{option.label}</span>
                  </div>
                );
              })}
            </div>
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

MultiSelectField.displayName = 'MultiSelectField';
