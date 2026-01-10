'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/AuthProviderContext';

/**
 * HeaderAuth - Isolated client component for authentication UI
 * 
 * This component isolates the auth-related client-side logic to minimize
 * the client boundary in the Header component.
 */
export function HeaderAuth() {
    const { user, loading, signOut } = useAuth();

    if (loading) {
        return <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />;
    }

    if (user) {
        return (
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
        );
    }

    return (
        <Link href="/login">
            <Button className="hidden md:inline-flex" size="sm">
                Sign In
            </Button>
        </Link>
    );
}
