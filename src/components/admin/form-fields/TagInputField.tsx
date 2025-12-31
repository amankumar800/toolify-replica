'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from './TextField';

export interface TagInputFieldProps extends BaseFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: string[];
  maxTags?: number;
  placeholder?: string;
}

/**
 * TagInputField component for managing arrays of tags
 * 
 * Requirements: 13.2
 * - Add tags by pressing Enter or comma
 * - Remove tags by clicking X or backspace
 * - Optional autocomplete suggestions
 * - Displays inline error messages
 */
export const TagInputField = React.forwardRef<HTMLDivElement, TagInputFieldProps>(
  (
    {
      name,
      label,
      value,
      onChange,
      suggestions = [],
      maxTags,
      placeholder = 'Add tag...',
      required = false,
      disabled = false,
      error,
      helpText,
    },
    ref
  ) => {
    const [inputValue, setInputValue] = React.useState('');
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = React.useState(-1);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const inputId = `field-${name}`;
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;

    // Filter suggestions based on input
    const filteredSuggestions = suggestions.filter(
      (s) =>
        s.toLowerCase().includes(inputValue.toLowerCase()) &&
        !value.includes(s)
    );

    // Close suggestions when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setShowSuggestions(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addTag = (tag: string) => {
      const trimmedTag = tag.trim();
      if (!trimmedTag) return;
      if (value.includes(trimmedTag)) return;
      if (maxTags && value.length >= maxTags) return;

      onChange([...value, trimmedTag]);
      setInputValue('');
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    };

    const removeTag = (tagToRemove: string) => {
      if (disabled) return;
      onChange(value.filter((tag) => tag !== tagToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && filteredSuggestions[selectedSuggestionIndex]) {
          addTag(filteredSuggestions[selectedSuggestionIndex]);
        } else {
          addTag(inputValue);
        }
      } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
        removeTag(value[value.length - 1]);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      // Handle comma-separated input
      if (newValue.includes(',')) {
        const tags = newValue.split(',');
        tags.forEach((tag, index) => {
          if (index < tags.length - 1) {
            addTag(tag);
          } else {
            setInputValue(tag);
          }
        });
      } else {
        setInputValue(newValue);
        setShowSuggestions(newValue.length > 0 && filteredSuggestions.length > 0);
        setSelectedSuggestionIndex(-1);
      }
    };

    const canAddMore = !maxTags || value.length < maxTags;

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
          {maxTags && (
            <span className="text-xs text-gray-500">
              {value.length}/{maxTags}
            </span>
          )}
        </div>
        <div ref={containerRef} className="relative">
          <div
            onClick={() => inputRef.current?.focus()}
            className={cn(
              'flex flex-wrap gap-1.5 min-h-[44px] w-full rounded-md border bg-background px-3 py-2',
              'ring-offset-background cursor-text',
              'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
              disabled && 'cursor-not-allowed opacity-50',
              error
                ? 'border-red-500 focus-within:ring-red-500'
                : 'border-[var(--input)]'
            )}
          >
            {value.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                  disabled={disabled}
                  className="hover:bg-blue-200 rounded-full p-0.5 disabled:opacity-50"
                  aria-label={`Remove ${tag}`}
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            {canAddMore && (
              <input
                ref={inputRef}
                id={inputId}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (inputValue && filteredSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                placeholder={value.length === 0 ? placeholder : ''}
                disabled={disabled}
                aria-invalid={!!error}
                aria-describedby={cn(error && errorId, helpText && helpId)}
                className="flex-1 min-w-[100px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            )}
          </div>
          {/* Suggestions dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-40 overflow-auto">
              {filteredSuggestions.map((suggestion, index) => (
                <div
                  key={suggestion}
                  onClick={() => addTag(suggestion)}
                  className={cn(
                    'px-3 py-2 cursor-pointer text-sm min-h-[40px] flex items-center',
                    index === selectedSuggestionIndex ? 'bg-blue-50' : 'hover:bg-gray-100'
                  )}
                >
                  {suggestion}
                </div>
              ))}
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

TagInputField.displayName = 'TagInputField';
