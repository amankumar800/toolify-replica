import { LoginForm } from '@/components/auth/LoginForm';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'Login',
    description: 'Login to your AI Tools Book account',
    alternates: {
        canonical: '/login', // Good SEO practice
    },
};

function LoginFormFallback() {
    return (
        <div className="grid gap-6 animate-pulse">
            <div className="grid gap-2 text-center">
                <div className="h-9 bg-gray-200 rounded w-48 mx-auto" />
                <div className="h-5 bg-gray-200 rounded w-64 mx-auto" />
            </div>
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <div className="h-4 bg-gray-200 rounded w-12" />
                    <div className="h-10 bg-gray-200 rounded" />
                </div>
                <div className="grid gap-2">
                    <div className="h-4 bg-gray-200 rounded w-16" />
                    <div className="h-10 bg-gray-200 rounded" />
                </div>
                <div className="h-10 bg-gray-200 rounded" />
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="w-full">
            <Suspense fallback={<LoginFormFallback />}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
