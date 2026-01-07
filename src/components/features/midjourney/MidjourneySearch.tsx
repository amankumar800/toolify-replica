'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MidjourneySearchProps {
    className?: string;
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    onSubmit?: (value: string) => void;
}

export function MidjourneySearch({
    className,
    placeholder = "Search styles, SREF codes, prompts...",
    value: controlledValue,
    onChange,
    onSubmit
}: MidjourneySearchProps) {
    const [internalValue, setInternalValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Use controlled or uncontrolled value
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    // Sync internal value with controlled value
    useEffect(() => {
        if (controlledValue !== undefined) {
            setInternalValue(controlledValue);
        }
    }, [controlledValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInternalValue(newValue);
        onChange?.(newValue);
    };

    const handleClear = () => {
        setInternalValue('');
        onChange?.('');
        onSubmit?.('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit?.(value);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleClear();
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={cn(
                "relative w-full max-w-2xl mx-auto",
                className
            )}
        >
            <div
                className={cn(
                    "relative flex items-center bg-white/10 backdrop-blur-sm border rounded-full overflow-hidden transition-all duration-300",
                    isFocused
                        ? "border-purple-500 ring-2 ring-purple-500/30 bg-white/15"
                        : "border-white/20 hover:border-white/40"
                )}
            >
                <div className="pl-5 text-gray-400">
                    <Search className="w-5 h-5" aria-hidden="true" />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent px-4 py-4 text-white placeholder:text-gray-400 focus:outline-none text-base"
                    aria-label="Search prompts and styles"
                />
                {/* Clear button */}
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-2 mr-1 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                        aria-label="Clear search"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
                <button
                    type="submit"
                    className="flex items-center justify-center h-10 w-10 mr-2 rounded-full bg-purple-600 hover:bg-purple-700 transition-colors shrink-0"
                    aria-label="Search"
                >
                    <Search className="w-4 h-4 text-white" />
                </button>
            </div>
            {/* Search hint */}
            {isFocused && !value && (
                <p className="absolute left-0 right-0 mt-2 text-xs text-gray-500 text-center">
                    Try "anime", "cyberpunk", "watercolor", or any style you're looking for
                </p>
            )}
        </form>
    );
}
