import { useCallback, useState, useEffect, RefObject } from 'react';

/**
 * Keyboard navigation options for dropdown components
 */
interface UseDropdownKeyboardOptions<T> {
    /** Array of selectable options */
    options: T[];
    /** Whether the dropdown is currently open */
    isOpen: boolean;
    /** Callback to close the dropdown */
    onClose: () => void;
    /** Callback when an option is selected */
    onSelect: (option: T, index: number) => void;
    /** Optional ref to the menu element for scroll management */
    menuRef?: RefObject<HTMLElement | null>;
    /** Whether to loop navigation at boundaries */
    loop?: boolean;
}

/**
 * Hook for full keyboard navigation in dropdown components.
 * Supports Arrow keys, Enter, Space, Escape, Home, End.
 * 
 * @example
 * ```tsx
 * const { highlightedIndex, handleKeyDown } = useDropdownKeyboard({
 *   options,
 *   isOpen,
 *   onClose: () => setIsOpen(false),
 *   onSelect: (opt) => { setValue(opt.value); setIsOpen(false); }
 * });
 * ```
 */
export function useDropdownKeyboard<T>({
    options,
    isOpen,
    onClose,
    onSelect,
    menuRef,
    loop = false
}: UseDropdownKeyboardOptions<T>) {
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    // Reset highlighted index when dropdown closes
    useEffect(() => {
        if (!isOpen) {
            setHighlightedIndex(-1);
        }
    }, [isOpen]);

    // Scroll highlighted option into view
    useEffect(() => {
        if (isOpen && highlightedIndex >= 0 && menuRef?.current) {
            const menu = menuRef.current;
            const options = menu.querySelectorAll('[role="option"]');
            const highlighted = options[highlightedIndex] as HTMLElement;

            if (highlighted) {
                highlighted.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex, isOpen, menuRef]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        // When closed, Enter/Space/ArrowDown should open
        if (!isOpen) {
            if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
                // Let the parent handle opening
                return;
            }
            return;
        }

        switch (event.key) {
            case 'Escape':
                event.preventDefault();
                event.stopPropagation();
                onClose();
                break;

            case 'ArrowDown':
                event.preventDefault();
                setHighlightedIndex(prev => {
                    const next = prev + 1;
                    if (next >= options.length) {
                        return loop ? 0 : options.length - 1;
                    }
                    return next;
                });
                break;

            case 'ArrowUp':
                event.preventDefault();
                setHighlightedIndex(prev => {
                    const next = prev - 1;
                    if (next < 0) {
                        return loop ? options.length - 1 : 0;
                    }
                    return next;
                });
                break;

            case 'Enter':
            case ' ':
                event.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < options.length) {
                    onSelect(options[highlightedIndex], highlightedIndex);
                }
                break;

            case 'Home':
                event.preventDefault();
                setHighlightedIndex(0);
                break;

            case 'End':
                event.preventDefault();
                setHighlightedIndex(options.length - 1);
                break;

            case 'Tab':
                // Close dropdown on Tab (standard behavior)
                onClose();
                break;
        }
    }, [isOpen, options, highlightedIndex, onClose, onSelect, loop]);

    return {
        highlightedIndex,
        setHighlightedIndex,
        handleKeyDown
    };
}

export default useDropdownKeyboard;
