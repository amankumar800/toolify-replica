'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from './TextField';

export interface JsonEditorFieldProps extends BaseFieldProps {
  value: Record<string, unknown> | null;
  onChange: (value: Record<string, unknown> | null) => void;
  rows?: number;
}

/**
 * JsonEditorField component for editing JSON data
 * 
 * Requirements: 13.2
 * - JSON syntax validation
 * - Pretty-print formatting
 * - Error highlighting for invalid JSON
 * - Displays inline error messages
 */
export const JsonEditorField = React.forwardRef<HTMLTextAreaElement, JsonEditorFieldProps>(
  (
    {
      name,
      label,
      value,
      onChange,
      rows = 8,
      required = false,
      disabled = false,
      error,
      helpText,
    },
    ref
  ) => {
    const [textValue, setTextValue] = React.useState('');
    const [parseError, setParseError] = React.useState<string | null>(null);
    const inputId = `field-${name}`;
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;

    const displayError = error || parseError;

    // Sync value to text
    React.useEffect(() => {
      if (value !== null) {
        setTextValue(JSON.stringify(value, null, 2));
      } else {
        setTextValue('');
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      setTextValue(newText);

      if (!newText.trim()) {
        setParseError(null);
        onChange(null);
        return;
      }

      try {
        const parsed = JSON.parse(newText);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          setParseError('Value must be a JSON object');
          return;
        }
        setParseError(null);
        onChange(parsed);
      } catch (err) {
        if (err instanceof SyntaxError) {
          setParseError(`Invalid JSON: ${err.message}`);
        } else {
          setParseError('Invalid JSON');
        }
      }
    };

    const handleFormat = () => {
      if (!textValue.trim()) return;
      
      try {
        const parsed = JSON.parse(textValue);
        setTextValue(JSON.stringify(parsed, null, 2));
        setParseError(null);
      } catch {
        // Keep current text if invalid
      }
    };

    const handleMinify = () => {
      if (!textValue.trim()) return;
      
      try {
        const parsed = JSON.parse(textValue);
        setTextValue(JSON.stringify(parsed));
        setParseError(null);
      } catch {
        // Keep current text if invalid
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleFormat}
              disabled={disabled || !textValue.trim()}
              className="text-xs px-2 py-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            >
              Format
            </button>
            <button
              type="button"
              onClick={handleMinify}
              disabled={disabled || !textValue.trim()}
              className="text-xs px-2 py-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            >
              Minify
            </button>
          </div>
        </div>
        <textarea
          ref={ref}
          id={inputId}
          name={name}
          value={textValue}
          onChange={handleChange}
          rows={rows}
          disabled={disabled}
          required={required}
          spellCheck={false}
          aria-invalid={!!displayError}
          aria-describedby={cn(displayError && errorId, helpText && helpId)}
          className={cn(
            'flex w-full rounded-md border bg-background px-3 py-2 text-sm',
            'ring-offset-background placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'font-mono text-xs',
            'min-h-[44px]',
            'resize-y',
            displayError
              ? 'border-red-500 focus-visible:ring-red-500'
              : 'border-[var(--input)]'
          )}
          placeholder='{"key": "value"}'
        />
        {displayError && (
          <p id={errorId} className="text-sm text-red-500" role="alert">
            {displayError}
          </p>
        )}
        {helpText && !displayError && (
          <p id={helpId} className="text-xs text-gray-500">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

JsonEditorField.displayName = 'JsonEditorField';
