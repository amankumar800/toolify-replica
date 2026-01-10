'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
    { href: '/free-ai-tools', label: 'Free AI Tools' },
    { href: '/best-trending-ai-tools', label: 'Ranking' },
    { href: '/midjourney-library', label: 'Midjourney' },
    { href: '/category', label: 'Categories' },
    { href: '/submit', label: 'Submit Tool' },
];

/**
 * HeaderNavLinks - Isolated client component for navigation with active state
 * 
 * This component isolates the usePathname hook to minimize the client boundary.
 */
export function HeaderNavLinks() {
    const pathname = usePathname();

    return (
        <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "text-sm font-medium transition-colors hover:text-[var(--primary)]",
                            isActive ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
                        )}
                    >
                        {link.label}
                    </Link>
                );
            })}
        </nav>
    );
}
