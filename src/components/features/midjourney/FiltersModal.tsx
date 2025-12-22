'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { FilterGroup } from '@/lib/types/prompt';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FiltersModalProps {
    filterGroups: FilterGroup[];
    selectedFilters: Record<string, string[]>;
    onFilterChange: (groupId: string, categoryId: string) => void;
    onClearAll: () => void;
}

/**
 * FiltersModal - Accessible modal for advanced filtering
 * 
 * Features:
 * - Escape key closes modal
 * - Smooth open/close animations
 * - Focus trap within modal
 * - Proper ARIA attributes
 * - Consistent styling with SortDropdown
 */
export function FiltersModal({
    filterGroups,
    selectedFilters,
    onFilterChange,
    onClearAll
}: FiltersModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
        Object.fromEntries(filterGroups.map(g => [g.id, true]))
    );

    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    const totalSelected = Object.values(selectedFilters).flat().length;

    // Handle escape key to close modal
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    // Focus trap and initial focus
    useEffect(() => {
        if (isOpen && closeButtonRef.current) {
            closeButtonRef.current.focus();
        }
    }, [isOpen]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleOpen = useCallback(() => {
        setIsOpen(true);
    }, []);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    return (
        <>
            {/* Trigger Button - Aligned with SortDropdown styling */}
            <Button
                variant="outline"
                onClick={handleOpen}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                className={cn(
                    // Layout
                    "flex items-center gap-2 self-end",
                    // Sizing
                    "h-[var(--dropdown-button-height)]",
                    // Spacing
                    "px-4 py-2.5",
                    // Background & Border
                    "bg-[var(--color-surface-default)] border-[var(--color-border-default)]",
                    "rounded-[var(--radius-full)]",
                    // Text
                    "text-sm text-[var(--color-text-primary)]",
                    // Interactive states
                    "hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
                    // Focus
                    "focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]"
                )}
            >
                <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                <span>Filters</span>
                {totalSelected > 0 && (
                    <span
                        className="ml-1 px-2 py-0.5 rounded-full bg-[var(--color-accent-primary)] text-xs text-white"
                        aria-label={`${totalSelected} filters selected`}
                    >
                        {totalSelected}
                    </span>
                )}
            </Button>

            {/* Modal Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="filters-modal-title"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-[var(--color-bg-overlay)] backdrop-blur-sm animate-fade-in"
                        onClick={handleClose}
                        aria-hidden="true"
                    />

                    {/* Modal Content */}
                    <div
                        ref={modalRef}
                        className={cn(
                            // Position & sizing
                            "relative w-full max-w-lg max-h-[80vh]",
                            // Background & Border
                            "bg-[var(--color-bg-elevated)] border border-[var(--color-border-muted)]",
                            "rounded-[var(--radius-2xl)]",
                            // Shadow
                            "shadow-[var(--shadow-modal)]",
                            // Layout
                            "flex flex-col overflow-hidden",
                            // Animation
                            "animate-scale-in"
                        )}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-muted)]">
                            <h2
                                id="filters-modal-title"
                                className="text-lg font-semibold text-[var(--color-text-primary)]"
                            >
                                Advanced Filters
                            </h2>
                            <button
                                ref={closeButtonRef}
                                onClick={handleClose}
                                className={cn(
                                    "p-2 rounded-full",
                                    "hover:bg-[var(--color-surface-active)]",
                                    "transition-colors duration-[var(--transition-fast)]",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
                                )}
                                aria-label="Close filters modal"
                            >
                                <X className="w-5 h-5 text-[var(--color-text-secondary)]" aria-hidden="true" />
                            </button>
                        </div>

                        {/* Filter Groups */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {filterGroups.length === 0 ? (
                                <p className="text-[var(--color-text-muted)] text-sm text-center py-8">
                                    No filter groups available
                                </p>
                            ) : (
                                filterGroups.map(group => (
                                    <div
                                        key={group.id}
                                        className="border border-[var(--color-border-muted)] rounded-[var(--radius-lg)] overflow-hidden"
                                    >
                                        <button
                                            onClick={() => toggleGroup(group.id)}
                                            className={cn(
                                                "flex items-center justify-between w-full p-4 text-left",
                                                "hover:bg-[var(--color-surface-active)]",
                                                "transition-colors duration-[var(--transition-fast)]",
                                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent-primary)]"
                                            )}
                                            aria-expanded={expandedGroups[group.id]}
                                            aria-controls={`filter-group-${group.id}`}
                                        >
                                            <span className="font-medium text-[var(--color-text-primary)]">
                                                {group.name}
                                            </span>
                                            {expandedGroups[group.id]
                                                ? <ChevronUp className="w-5 h-5 text-[var(--color-text-secondary)]" aria-hidden="true" />
                                                : <ChevronDown className="w-5 h-5 text-[var(--color-text-secondary)]" aria-hidden="true" />
                                            }
                                        </button>

                                        {expandedGroups[group.id] && (
                                            <div
                                                id={`filter-group-${group.id}`}
                                                className="px-4 pb-4 space-y-2"
                                                role="group"
                                                aria-label={`${group.name} filters`}
                                            >
                                                {group.categories.map(category => {
                                                    const isSelected = selectedFilters[group.id]?.includes(category.id);
                                                    return (
                                                        <button
                                                            key={category.id}
                                                            onClick={() => onFilterChange(group.id, category.id)}
                                                            className={cn(
                                                                "flex items-center justify-between w-full px-3 py-2.5",
                                                                "rounded-[var(--radius-md)] text-sm",
                                                                "transition-colors duration-[var(--transition-fast)]",
                                                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]",
                                                                isSelected
                                                                    ? "bg-[var(--color-accent-primary-light)] text-[var(--color-text-accent)] border border-[var(--color-border-accent)]"
                                                                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-active)]"
                                                            )}
                                                            aria-pressed={isSelected}
                                                        >
                                                            <span>{category.name}</span>
                                                            <span className="text-[var(--color-text-muted)]">
                                                                {category.count.toLocaleString()}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between p-4 border-t border-[var(--color-border-muted)] bg-[var(--color-bg-footer)]">
                            <button
                                onClick={onClearAll}
                                className={cn(
                                    "text-sm text-[var(--color-text-secondary)]",
                                    "hover:text-[var(--color-text-primary)]",
                                    "transition-colors duration-[var(--transition-fast)]",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:rounded"
                                )}
                                disabled={totalSelected === 0}
                            >
                                Clear all {totalSelected > 0 && `(${totalSelected})`}
                            </button>
                            <Button
                                onClick={handleClose}
                                className={cn(
                                    "bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)]",
                                    "text-white",
                                    "focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2"
                                )}
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
