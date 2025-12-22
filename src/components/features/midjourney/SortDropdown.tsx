'use client';

import { useState, useCallback, useRef, useId, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useDropdownKeyboard } from '@/hooks/useDropdownKeyboard';
import { DropdownOption, DropdownProps, getOptionLabel } from '@/lib/types/dropdown';

/**
 * SortDropdown - Fully accessible dropdown component
 * 
 * Features:
 * - WCAG 2.1 AA compliant with proper ARIA attributes
 * - Full keyboard navigation (Arrow keys, Enter, Space, Escape, Home, End)
 * - Proper label association with htmlFor/id
 * - Smart positioning (flips when near viewport edge)
 * - Smooth animations
 * - Controlled or uncontrolled open state
 * 
 * @example
 * ```tsx
 * <SortDropdown
 *   label="Sort by:"
 *   value={sortBy}
 *   onChange={setSortBy}
 *   options={[
 *     { value: 'default', label: 'Default' },
 *     { value: 'popular', label: 'Most Popular' }
 *   ]}
 * />
 * ```
 */
export function SortDropdown<T extends string = string>({
    value,
    onChange,
    options,
    label,
    placeholder = 'Select',
    className,
    id: providedId,
    disabled = false,
    isOpen: controlledIsOpen,
    onOpenChange
}: DropdownProps<T>) {
    // Generate unique IDs for accessibility
    const autoId = useId();
    const baseId = providedId || autoId;
    const buttonId = `${baseId}-button`;
    const menuId = `${baseId}-menu`;
    const labelId = `${baseId}-label`;

    // State management - support both controlled and uncontrolled
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

    const setIsOpen = useCallback((open: boolean) => {
        if (controlledIsOpen !== undefined) {
            onOpenChange?.(open);
        } else {
            setInternalIsOpen(open);
        }
    }, [controlledIsOpen, onOpenChange]);

    // Refs for DOM elements
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Position state for smart dropdown placement
    const [menuPosition, setMenuPosition] = useState<'bottom' | 'top'>('bottom');

    // Get current selection label with fallback
    const selectedLabel = getOptionLabel(value, options as DropdownOption<T>[], placeholder);

    // Handle option selection
    const handleSelect = useCallback((option: DropdownOption<T>) => {
        if (option.disabled) return;
        onChange(option.value);
        setIsOpen(false);
        // Return focus to button after selection
        buttonRef.current?.focus();
    }, [onChange, setIsOpen]);

    // Keyboard navigation hook
    const { highlightedIndex, setHighlightedIndex, handleKeyDown } = useDropdownKeyboard({
        options: options as DropdownOption<T>[],
        isOpen,
        onClose: () => {
            setIsOpen(false);
            buttonRef.current?.focus();
        },
        onSelect: (option) => handleSelect(option),
        menuRef,
        loop: true
    });

    // Click outside to close
    useClickOutside(containerRef, () => setIsOpen(false), isOpen);

    // Calculate menu position based on available space
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const menuHeight = 200; // Approximate menu height

            if (spaceBelow < menuHeight && rect.top > menuHeight) {
                setMenuPosition('top');
            } else {
                setMenuPosition('bottom');
            }
        }
    }, [isOpen]);

    // Toggle dropdown
    const handleToggle = useCallback(() => {
        if (disabled) return;
        setIsOpen(!isOpen);
        // Highlight current value when opening
        if (!isOpen) {
            const currentIndex = options.findIndex(o => o.value === value);
            setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
        }
    }, [disabled, isOpen, setIsOpen, options, value, setHighlightedIndex]);

    // Handle button keydown
    const handleButtonKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (disabled) return;

        if (!isOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
            e.preventDefault();
            handleToggle();
            return;
        }

        handleKeyDown(e);
    }, [disabled, isOpen, handleToggle, handleKeyDown]);

    return (
        <div
            ref={containerRef}
            className={cn("relative flex flex-col", className)}
        >
            {/* Label - properly associated with button */}
            {label && (
                <label
                    id={labelId}
                    htmlFor={buttonId}
                    className="text-sm text-[var(--color-text-secondary)] mb-1.5 cursor-pointer"
                >
                    {label}
                </label>
            )}

            {/* Trigger Button */}
            <button
                ref={buttonRef}
                id={buttonId}
                type="button"
                onClick={handleToggle}
                onKeyDown={handleButtonKeyDown}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={menuId}
                aria-labelledby={label ? labelId : undefined}
                aria-label={label ? undefined : placeholder}
                className={cn(
                    // Layout
                    "flex items-center gap-2",
                    // Sizing
                    "min-w-[var(--dropdown-min-width)] h-[var(--dropdown-button-height)]",
                    // Spacing
                    "px-4 py-2.5",
                    // Background & Border
                    "bg-[var(--color-surface-default)] border border-[var(--color-border-default)]",
                    "rounded-[var(--radius-full)]",
                    // Text
                    "text-sm text-[var(--color-text-primary)]",
                    // Interactive states
                    "hover:bg-[var(--color-surface-hover)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]",
                    // Transitions
                    "transition-colors duration-[var(--transition-fast)]",
                    // Disabled state
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <span className="text-sm truncate flex-1 text-left">{selectedLabel}</span>
                <ChevronDown
                    className={cn(
                        "w-4 h-4 flex-shrink-0 transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                    aria-hidden="true"
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    ref={menuRef}
                    id={menuId}
                    role="listbox"
                    aria-labelledby={label ? labelId : buttonId}
                    aria-activedescendant={highlightedIndex >= 0 ? `${baseId}-option-${highlightedIndex}` : undefined}
                    tabIndex={-1}
                    className={cn(
                        // Position
                        "absolute left-0 z-[var(--z-dropdown-menu)]",
                        menuPosition === 'bottom'
                            ? "top-full mt-2"
                            : "bottom-full mb-2",
                        // Sizing
                        "w-[var(--dropdown-menu-width)] min-w-full max-h-60",
                        // Background & Border
                        "bg-[var(--color-bg-elevated)] border border-[var(--color-border-muted)]",
                        "rounded-[var(--radius-lg)]",
                        // Shadow
                        "shadow-[var(--shadow-dropdown)]",
                        // Overflow
                        "overflow-y-auto",
                        // Animation
                        menuPosition === 'bottom' ? "animate-slide-down" : "animate-slide-up"
                    )}
                >
                    <div className="py-1">
                        {options.length === 0 ? (
                            <div className="px-4 py-2 text-sm text-[var(--color-text-muted)]">
                                No options available
                            </div>
                        ) : (
                            options.map((option, index) => {
                                const isSelected = value === option.value;
                                const isHighlighted = index === highlightedIndex;

                                return (
                                    <button
                                        key={option.value}
                                        id={`${baseId}-option-${index}`}
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        aria-disabled={option.disabled}
                                        onClick={() => handleSelect(option)}
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                        disabled={option.disabled}
                                        className={cn(
                                            // Layout
                                            "flex items-center w-full",
                                            // Spacing
                                            "px-4 py-2.5",
                                            // Text
                                            "text-sm text-left",
                                            // States
                                            isSelected && "bg-[var(--color-accent-primary-light)] text-[var(--color-text-accent)]",
                                            !isSelected && isHighlighted && "bg-[var(--color-surface-active)]",
                                            !isSelected && !isHighlighted && "text-[var(--color-text-secondary)]",
                                            // Hover (only when not highlighted by keyboard)
                                            "hover:bg-[var(--color-surface-active)]",
                                            // Disabled
                                            option.disabled && "opacity-50 cursor-not-allowed",
                                            // Transitions
                                            "transition-colors duration-[var(--transition-fast)]"
                                        )}
                                    >
                                        {option.icon && (
                                            <span className="mr-2 flex-shrink-0">{option.icon}</span>
                                        )}
                                        <span className="truncate">{option.label}</span>
                                        {isSelected && (
                                            <svg
                                                className="ml-auto w-4 h-4 flex-shrink-0 text-[var(--color-accent-primary)]"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                aria-hidden="true"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SortDropdown;
