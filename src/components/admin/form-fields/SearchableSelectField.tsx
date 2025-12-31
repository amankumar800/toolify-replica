'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from './TextField';
import type { SelectOption } from './SelectField';

export interface SearchableSelectFieldProps extends BaseFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
  onSearch: (query: string) => Promise<SelectOption[]>;
  placeholder?: string;
  debounceMs?: number;
  minSearchLength?: number;
}

/**
 * SearchableSelectField component with async search capability
 * 
 * Requirements: 13.2
 * - Single selection with search
 * - Async search with debounce
 * - Loading state during search
 * - Displays inline error messages
 */
export const SearchableSelectField = React.forwardRef<HTMLDivElement, SearchableSelectFieldProps>(
  (
    {
      name,
      label,
      value,
      onChange,
      onSearch,
      placeholder = 'Search...',
      required = false,
      disabled = false,
      error,
      helpText,
      debounceMs = 300,
      minSearchLength = 1,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [options, setOptions] = React.useState<SelectOption[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [selectedLabel, setSelectedLabel] = React.useState<string | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
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

    // Debounced search
    React.useEffect(() => {
      if (searchQuery.length < minSearchLength) {
        setOptions([]);
        return;
      }

      const timeoutId = setTimeout(async () => {
        setIsLoading(true);
        try {
          const results = await onSearch(searchQuery);
          setOptions(results);
        } catch {
          setOptions([]);
        } finally {
          setIsLoading(false);
        }
      }, debounceMs);

      return () => clearTimeout(timeoutId);
    }, [searchQuery, onSearch, debounceMs, minSearchLength]);

    // Load initial value label
    React.useEffect(() => {
      if (value && !selectedLabel) {
        onSearch(value).then((results) => {
          const found = results.find((o) => o.value === value);
          if (found) {
            setSelectedLabel(found.label);
          }
        });
      }
    }, [value, selectedLabel, onSearch]);

    const handleSelect = (option: SelectOption) => {
      onChange(option.value);
      setSelectedLabel(option.label);
      setSearchQuery('');
      setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
      setSelectedLabel(null);
      setSearchQuery('');
    };

    const handleInputFocus = () => {
      setIsOpen(true);
    };

    return (
      <div className="space-y-1.5" ref={ref}>
        <label
          htmlFor={inputId}
          className={cn(
            'text-sm font-medium leading-none block',
            disabled && 'opacity-70 cursor-not-allowed'
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div ref={containerRef} className="relative">
          <div
            className={cn(
              'flex items-center min-h-[44px] w-full rounded-md border bg-background px-3 py-2',
              'ring-offset-background',
              'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
              disabled && 'cursor-not-allowed opacity-50',
              error
                ? 'border-red-500 focus-within:ring-red-500'
                : 'border-[var(--input)]'
            )}
          >
            {value && selectedLabel ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-sm">{selectedLabel}</span>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={disabled}
                  className="p-1 hover:bg-gray-100 rounded"
                  aria-label="Clear selection"
                >
                  <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <input
                ref={inputRef}
                id={inputId}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleInputFocus}
                placeholder={placeholder}
                disabled={disabled}
                aria-invalid={!!error}
                aria-describedby={cn(error && errorId, helpText && helpId)}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            )}
            {isLoading && (
              <div className="ml-2">
                <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
          </div>
          {isOpen && !value && (
            <div
              role="listbox"
              className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto"
            >
              {isLoading ? (
                <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
              ) : options.length > 0 ? (
                options.map((option) => (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={value === option.value}
                    aria-disabled={option.disabled}
                    onClick={() => !option.disabled && handleSelect(option)}
                    className={cn(
                      'px-3 py-2 cursor-pointer text-sm min-h-[44px] flex items-center',
                      option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                    )}
                  >
                    {option.label}
                  </div>
                ))
              ) : searchQuery.length >= minSearchLength ? (
                <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">
                  Type at least {minSearchLength} character{minSearchLength > 1 ? 's' : ''} to search
                </div>
              )}
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

SearchableSelectField.displayName = 'SearchableSelectField';
