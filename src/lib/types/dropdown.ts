/**
 * Type definitions for dropdown components
 * Provides type safety and autocompletion for dropdown values
 */

/**
 * A single option in a dropdown menu
 */
export interface DropdownOption<T extends string = string> {
    /** The value that will be passed to onChange */
    value: T;
    /** Display label shown in the dropdown */
    label: string;
    /** Whether this option is disabled */
    disabled?: boolean;
    /** Optional icon to display */
    icon?: React.ReactNode;
}

/**
 * Props for the SortDropdown component
 */
export interface DropdownProps<T extends string = string> {
    /** Currently selected value */
    value: T;
    /** Callback when selection changes */
    onChange: (value: T) => void;
    /** Available options */
    options: DropdownOption<T>[];
    /** Label text displayed above dropdown */
    label?: string;
    /** Placeholder when no value selected */
    placeholder?: string;
    /** Additional CSS classes */
    className?: string;
    /** Unique identifier for accessibility */
    id?: string;
    /** Disabled state */
    disabled?: boolean;
    /** Controlled open state from parent (for exclusive dropdowns) */
    isOpen?: boolean;
    /** Callback when open state changes (for controlled mode) */
    onOpenChange?: (isOpen: boolean) => void;
}

/**
 * Validates that a value exists in the options array
 */
export function isValidOption<T extends string>(
    value: T,
    options: DropdownOption<T>[]
): boolean {
    return options.some(opt => opt.value === value);
}

/**
 * Gets the label for a given value from options
 */
export function getOptionLabel<T extends string>(
    value: T,
    options: DropdownOption<T>[],
    fallback: string = 'Select'
): string {
    const option = options.find(opt => opt.value === value);
    return option?.label ?? fallback;
}
