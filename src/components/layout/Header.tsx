import Link from 'next/link';
import { Container } from './Container';
import { SearchBar } from '@/components/features/SearchBar';
import { MobileNav } from './MobileNav';
import { HeaderNavLinks } from './HeaderNavLinks';
import { HeaderAuth } from './HeaderAuth';
import { HeaderMobileSearch } from './HeaderMobileSearch';

/**
 * Header Component - Server Component with isolated client boundaries
 * 
 * The Header is now a server component that composes smaller client components:
 * - HeaderNavLinks: Handles active state detection (usePathname)
 * - HeaderAuth: Handles authentication UI (useAuth)
 * - HeaderMobileSearch: Handles mobile search modal state (useState)
 * - SearchBar: Existing client component for search
 * - MobileNav: Existing client component for mobile navigation
 * 
 * This optimization reduces the client-side JavaScript bundle by keeping
 * the static parts (logo, container structure) as server-rendered HTML.
 */
export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)/80] backdrop-blur supports-[backdrop-filter]:bg-[var(--background)/60]">
            <Container className="h-[var(--header-height)] flex items-center justify-between">
                {/* Logo - Server rendered */}
                <div className="flex items-center gap-2">
                    <Link href="/" className="font-bold text-xl tracking-tight text-[var(--primary)]">
                        AI Tools Book
                    </Link>
                </div>

                {/* Desktop Nav - Client component for active state */}
                <HeaderNavLinks />

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                    {/* Desktop Search - Client component */}
                    <div className="hidden md:block w-64">
                        <SearchBar variant="header" />
                    </div>

                    {/* Mobile Search - Isolated client component */}
                    <HeaderMobileSearch />

                    {/* Auth UI - Isolated client component */}
                    <HeaderAuth />

                    {/* Mobile Menu - Client component */}
                    <MobileNav />
                </div>
            </Container>
        </header>
    );
}
