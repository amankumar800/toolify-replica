'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // Assuming cn utility exists

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const toggleMenu = () => setIsOpen(!isOpen);

    const links = [
        { href: '/Best-trending-AI-Tools', label: 'Ranking' },
        { href: '/midjourney-library', label: 'Midjourney' },
        { href: '/category', label: 'Category' },
        { href: '/submit', label: 'Submit Tool' },
    ];

    return (
        <div className="md:hidden">
            <button
                onClick={toggleMenu}
                className="p-2 text-gray-600 hover:text-primary transition-colors"
                aria-label="Toggle Menu"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Sheet */}
            <div className={cn(
                "fixed inset-y-0 right-0 z-50 w-[280px] bg-white border-l shadow-2xl transform transition-transform duration-300 ease-in-out",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="flex flex-col h-full bg-white">
                    <div className="p-4 border-b flex items-center justify-between">
                        <span className="font-bold text-lg">Menu</span>
                        <button onClick={toggleMenu} className="p-2 text-gray-500 hover:text-gray-900">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-4 px-4">
                        <nav className="flex flex-col gap-2">
                            {links.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "px-4 py-3 rounded-md text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-gray-700 hover:bg-gray-100"
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="mt-8 pt-8 border-t space-y-4">
                            <Button asChild className="w-full justify-center" variant="default">
                                <Link href="/login" onClick={() => setIsOpen(false)}>Sign In</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
