import Link from 'next/link';
import { Container } from './Container';
import { Search } from 'lucide-react';
import { SearchBar } from '@/components/features/SearchBar';

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)/80] backdrop-blur supports-[backdrop-filter]:bg-[var(--background)/60]">
            <Container className="h-[var(--header-height)] flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <Link href="/" className="font-bold text-xl tracking-tight text-[var(--primary)]">
                        Toolify.ai
                    </Link>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6">
                    <Link href="/category/ai-video" className="text-sm font-medium hover:text-[var(--primary)] transition-colors">
                        AI Video
                    </Link>
                    <Link href="/category/ai-image" className="text-sm font-medium hover:text-[var(--primary)] transition-colors">
                        AI Image
                    </Link>
                    <Link href="/category" className="text-sm font-medium hover:text-[var(--primary)] transition-colors">
                        Category
                    </Link>
                    <Link href="/submit" className="text-sm font-medium hover:text-[var(--primary)] transition-colors">
                        Submit Tool
                    </Link>
                </nav>

                {/* Search Bar */}
                <div className="flex items-center gap-4">
                    <div className="hidden md:block w-64">
                        <SearchBar variant="header" />
                    </div>
                    <button type="button" className="md:hidden p-2 text-[var(--muted-foreground)]" aria-label="Search">
                        <Search className="w-6 h-6" />
                    </button>

                    <button type="button" className="hidden md:block bg-[var(--primary)] text-white px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium hover:opacity-90 transition-opacity">
                        Sign In
                    </button>
                </div>
            </Container>
        </header>
    );
}
