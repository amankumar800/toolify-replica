'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

/**
 * Category item for sidebar
 */
interface CategoryItem {
    id: string;
    name: string;
    slug: string;
    toolCount: number;
}

/**
 * Props for CategoryBrowseSidebar component
 */
export interface CategoryBrowseSidebarProps {
    /** List of categories to display */
    categories: CategoryItem[];
    /** Additional CSS classes */
    className?: string;
}

/**
 * CategoryBrowseSidebar Component
 * 
 * Client component providing sticky sidebar navigation with:
 * - IntersectionObserver for active section tracking
 * - Smooth scroll to section on click
 * - aria-current for accessibility
 * - Hidden on mobile (accordion shows instead)
 * 
 * Performance considerations:
 * - Uses requestAnimationFrame for smooth updates
 * - Debounced scroll handling
 * - threshold: 0.3 for reliable section detection
 */
export function CategoryBrowseSidebar({
    categories,
    className,
}: CategoryBrowseSidebarProps) {
    const [activeId, setActiveId] = useState<string>('');
    const observerRef = useRef<IntersectionObserver | null>(null);
    const sectionsRef = useRef<Map<string, IntersectionObserverEntry>>(new Map());

    /**
     * Handle click on sidebar item - smooth scroll to section
     */
    const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, categoryId: string) => {
        e.preventDefault();
        const sectionId = `category-${categoryId}`;
        const element = document.getElementById(sectionId);

        if (element) {
            // Smooth scroll to section
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            // Update active state immediately for responsiveness
            setActiveId(categoryId);

            // Move focus to section header for screen readers
            const heading = element.querySelector('h2');
            if (heading) {
                heading.setAttribute('tabindex', '-1');
                heading.focus({ preventScroll: true });
            }
        }
    }, []);

    /**
     * Set up IntersectionObserver for section tracking
     */
    useEffect(() => {
        // Clean up previous observer
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        // Create new observer
        observerRef.current = new IntersectionObserver(
            (entries) => {
                // Update our tracking map
                entries.forEach((entry) => {
                    sectionsRef.current.set(entry.target.id, entry);
                });

                // Find the most visible section using RAF for smooth updates
                requestAnimationFrame(() => {
                    let maxRatio = 0;
                    let maxId = '';

                    sectionsRef.current.forEach((entry, id) => {
                        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
                            maxRatio = entry.intersectionRatio;
                            maxId = id;
                        }
                    });

                    if (maxId) {
                        // Extract category ID from section ID (format: category-{id})
                        const categoryId = maxId.replace('category-', '');
                        setActiveId(categoryId);
                    }
                });
            },
            {
                // Root margin creates a detection zone in the upper portion of viewport
                rootMargin: '-20% 0px -70% 0px',
                threshold: [0, 0.1, 0.3, 0.5, 0.7, 1],
            }
        );

        // Observe all category sections
        categories.forEach((category) => {
            const section = document.getElementById(`category-${category.id}`);
            if (section && observerRef.current) {
                observerRef.current.observe(section);
            }
        });

        // Set initial active to first category
        if (categories.length > 0 && !activeId) {
            setActiveId(categories[0].id);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [categories, activeId]);

    return (
        <aside
            className={cn(
                // Hidden on mobile, visible on desktop
                'hidden lg:block',
                // Width and positioning
                'w-60 flex-shrink-0',
                className
            )}
            aria-label="Category navigation"
        >
            <div
                className={cn(
                    'sticky',
                    'top-[calc(var(--header-height,64px)+1rem)]',
                    'max-h-[calc(100vh-var(--header-height,64px)-2rem)]',
                    'overflow-y-auto',
                    // Custom scrollbar
                    'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
                    'scrollbar-track-transparent'
                )}
            >
                <nav className="flex flex-col gap-1 pr-4" role="navigation">
                    <h2 className="sr-only">Browse categories</h2>

                    {categories.map((category) => {
                        const isActive = activeId === category.id;

                        return (
                            <a
                                key={category.id}
                                href={`#category-${category.id}`}
                                onClick={(e) => handleClick(e, category.id)}
                                className={cn(
                                    'group flex items-center gap-3 px-3 py-2.5 rounded-lg',
                                    'text-sm font-medium',
                                    'transition-all duration-150',
                                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',

                                    isActive
                                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                )}
                                aria-current={isActive ? 'true' : undefined}
                            >
                                {/* Category Icon */}
                                <CategoryIcon
                                    slug={category.slug}
                                    size="sm"
                                    className="flex-shrink-0"
                                />

                                {/* Category Name */}
                                <span className="truncate flex-1">
                                    {category.name}
                                </span>

                                {/* Tool Count */}
                                <span
                                    className={cn(
                                        'text-xs px-1.5 py-0.5 rounded-full flex-shrink-0',
                                        isActive
                                            ? 'bg-purple-100 dark:bg-purple-800/30 text-purple-600 dark:text-purple-300'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                    )}
                                >
                                    {category.toolCount}
                                </span>
                            </a>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}

export default CategoryBrowseSidebar;
