import Link from 'next/link';
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary';
    href?: string;
    external?: boolean;
}

/**
 * Pill Button - Reusable rounded button component
 * 
 * Fixes Issue #25: CSS Class Explosion - Extracts repeated button styles
 */
export function PillButton({
    children,
    variant = 'primary',
    href,
    external = false,
    className,
    ...props
}: PillButtonProps) {
    const baseStyles = cn(
        'inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-medium text-sm transition-all touch-target',
        'focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:outline-none',
        variant === 'primary'
            ? 'bg-[var(--primary)] text-white hover:opacity-90 shadow-md hover:shadow-lg'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        className
    );

    // If href provided, render as Link
    if (href) {
        return (
            <Link
                href={href}
                className={baseStyles}
                {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
            >
                {children}
            </Link>
        );
    }

    return (
        <button className={baseStyles} {...props}>
            {children}
        </button>
    );
}
