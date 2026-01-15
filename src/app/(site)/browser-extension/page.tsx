import { Metadata } from 'next';
import { Container } from '@/components/layout/Container';
import { getToolsByPlatform } from '@/lib/services';
import { CompactToolCard } from '@/components/features/home/CompactToolCard';
import { Globe } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Best AI Browser Extensions - AI Tools Book',
    description: 'Discover the best AI-powered browser extensions for Chrome, Firefox, and Edge. Get AI assistance, writing help, and productivity tools right in your browser.',
    openGraph: {
        title: 'Best AI Browser Extensions - AI Tools Book',
        description: 'Discover the best AI-powered browser extensions for Chrome, Firefox, and Edge.',
        type: 'website',
    },
};

// ISR revalidation every 30 minutes
export const revalidate = 1800;

export default async function BrowserExtensionPage() {
    const tools = await getToolsByPlatform('browser-extension');

    return (
        <div className="min-h-screen py-8">
            <Container>
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Globe className="w-6 h-6 text-blue-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">AI Browser Extensions</h1>
                    </div>
                    <p className="text-gray-600 max-w-2xl">
                        Supercharge your browser with AI-powered extensions. Get writing assistance,
                        translation, meeting transcription, and more—all without leaving your current tab.
                    </p>
                </div>

                {/* Tools Grid */}
                {tools.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">No browser extensions yet</h2>
                        <p className="text-gray-500 mb-4">Check back soon for AI browser extension tools.</p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Back to Home
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {tools.map((tool) => (
                            <CompactToolCard key={tool.id} {...tool} />
                        ))}
                    </div>
                )}

                {/* Back Link */}
                {tools.length > 0 && (
                    <div className="mt-8 text-center">
                        <Link
                            href="/"
                            className="text-[var(--primary)] hover:underline"
                        >
                            ← Back to Home
                        </Link>
                    </div>
                )}
            </Container>
        </div>
    );
}
