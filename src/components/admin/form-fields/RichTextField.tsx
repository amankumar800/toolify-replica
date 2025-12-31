'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from './TextField';

export interface RichTextFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  minHeight?: string;
}

/**
 * RichTextField component - Simple WYSIWYG editor
 * 
 * Requirements: 13.2
 * - Basic rich text editing (bold, italic, lists, links)
 * - Character counter when maxLength is set
 * - Uses contentEditable for simplicity (no external dependencies)
 * - Displays inline error messages
 * 
 * Note: For production, consider using a library like TipTap or Slate
 * This implementation provides basic functionality without external deps
 */
export const RichTextField = React.forwardRef<HTMLDivElement, RichTextFieldProps>(
  (
    {
      name,
      label,
      value,
      onChange,
      maxLength,
      placeholder = 'Enter content...',
      required = false,
      disabled = false,
      error,
      helpText,
      minHeight = '200px',
    },
    ref
  ) => {
    const editorRef = React.useRef<HTMLDivElement>(null);
    const inputId = `field-${name}`;
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;
    
    // Get plain text length for character count
    const getTextLength = (html: string): number => {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      return temp.textContent?.length || 0;
    };
    
    const charCount = getTextLength(value);

    // Execute formatting command
    const execCommand = (command: string, value?: string) => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
      handleInput();
    };

    const handleInput = () => {
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    };

    // Sync value to editor
    React.useEffect(() => {
      if (editorRef.current && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }, [value]);

    const toolbarButtons = [
      { command: 'bold', icon: 'B', title: 'Bold', className: 'font-bold' },
      { command: 'italic', icon: 'I', title: 'Italic', className: 'italic' },
      { command: 'underline', icon: 'U', title: 'Underline', className: 'underline' },
      { command: 'insertUnorderedList', icon: '•', title: 'Bullet List' },
      { command: 'insertOrderedList', icon: '1.', title: 'Numbered List' },
    ];

    const handleLinkInsert = () => {
      const url = prompt('Enter URL:');
      if (url) {
        execCommand('createLink', url);
      }
    };

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
          {maxLength && (
            <span
              className={cn(
                'text-xs',
                charCount > maxLength ? 'text-red-500' : 'text-gray-500'
              )}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
        <div
          className={cn(
            'rounded-md border bg-background',
            'ring-offset-background',
            'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
            disabled && 'opacity-50',
            error
              ? 'border-red-500 focus-within:ring-red-500'
              : 'border-[var(--input)]'
          )}
        >
          {/* Toolbar */}
          <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-md flex-wrap">
            {toolbarButtons.map((btn) => (
              <button
                key={btn.command}
                type="button"
                onClick={() => execCommand(btn.command)}
                disabled={disabled}
                title={btn.title}
                className={cn(
                  'px-2 py-1 min-w-[32px] min-h-[32px] rounded hover:bg-gray-200 text-sm',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  btn.className
                )}
              >
                {btn.icon}
              </button>
            ))}
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <button
              type="button"
              onClick={handleLinkInsert}
              disabled={disabled}
              title="Insert Link"
              className={cn(
                'px-2 py-1 min-w-[32px] min-h-[32px] rounded hover:bg-gray-200 text-sm',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              🔗
            </button>
            <button
              type="button"
              onClick={() => execCommand('removeFormat')}
              disabled={disabled}
              title="Clear Formatting"
              className={cn(
                'px-2 py-1 min-w-[32px] min-h-[32px] rounded hover:bg-gray-200 text-sm',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              ✕
            </button>
          </div>
          {/* Editor */}
          <div
            ref={editorRef}
            id={inputId}
            contentEditable={!disabled}
            onInput={handleInput}
            onBlur={handleInput}
            data-placeholder={placeholder}
            aria-invalid={!!error}
            aria-describedby={cn(error && errorId, helpText && helpId)}
            className={cn(
              'p-3 text-sm outline-none overflow-auto',
              'prose prose-sm max-w-none',
              '[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400',
              disabled && 'cursor-not-allowed'
            )}
            style={{ minHeight }}
          />
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

RichTextField.displayName = 'RichTextField';
