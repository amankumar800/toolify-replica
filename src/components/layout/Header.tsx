'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from './Container';
import { Search, LogOut } from 'lucide-react';
import { SearchBar } from '@/components/features/SearchBar';
import { MobileNav } from './MobileNav';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/AuthProviderContext';

export function Header() {
    const pathname = usePathname();
    const { user, loading, signOut } = useAuth();

    const navLinks = [
        { href: '/free-ai-tools', label: 'Free AI Tools' },
        { href: '/Best-trending-AI-Tools', label: 'Ranking' },
        { href: '/midjourney-library', label: 'Midjourney' },
        { href: '/category', label: 'Categories' },
        { href: '/submit', label: 'Submit Tool' },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)/80] backdrop-blur supports-[backdrop-filter]:bg-[var(--background)/60]">
            <Container className="h-[var(--header-height)] flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <Link href="/" className="font-bold text-xl tracking-tight text-[var(--primary)]">
                        AI Tools Book
                    </Link>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => {
                        // Active state: exact match OR starts with path + '/' for nested routes
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

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                    <div className="hidden md:block w-64">
                        <SearchBar variant="header" />
                    </div>

                    {/* Mobile Search Trigger */}
                    <button type="button" className="md:hidden p-2 text-[var(--muted-foreground)]" aria-label="Search">
                        <Search className="w-5 h-5" />
                    </button>

                    {/* Auth UI */}
                    {loading ? (
                        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                    ) : user ? (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                {user.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className="hidden lg:inline text-sm text-[var(--muted-foreground)]">
                                {user.email}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => signOut()}
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4 text-gray-500" />
                            </Button>
                        </div>
                    ) : (
                        <Link href="/login">
                            <Button className="hidden md:inline-flex" size="sm">
                                Sign In
                            </Button>
                        </Link>
                    )}

                    {/* Mobile Menu */}
                    <MobileNav />
                </div>
            </Container>
        </header>
    );
}
