import Link from 'next/link';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Access Denied | AI Tools Book',
    description: 'You do not have permission to view this page',
};

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
            <div className="max-w-md w-full text-center">
                {/* Icon */}
                <div className="mb-8">
                    <div className="mx-auto w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-red-500/20">
                        <ShieldX className="w-12 h-12 text-red-400" />
                    </div>

                    {/* Error Code */}
                    <p className="text-red-400 font-mono text-sm mb-3">ERROR 403</p>

                    {/* Heading */}
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Access Denied
                    </h1>

                    {/* Description */}
                    <p className="text-slate-400 text-lg leading-relaxed">
                        You don&apos;t have permission to access this page.
                        This area is restricted to administrators only.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all font-medium shadow-lg shadow-blue-600/25"
                    >
                        <Home className="w-4 h-4" />
                        Go to Homepage
                    </Link>
                </div>
            </div>
        </div>
    );
}
