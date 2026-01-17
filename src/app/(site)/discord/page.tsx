import { Metadata } from 'next';
import { Container } from '@/components/layout/Container';
import { getDiscordToolsForPage } from '@/lib/services';
import { DiscordToolCard } from '@/components/features/home/DiscordToolCard';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'AI Discord Communities - AI Tools Book',
    description: 'Discover AI tools with active Discord communities. Join discussions, get support, and connect with other users.',
    openGraph: {
        title: 'AI Discord Communities - AI Tools Book',
        description: 'Discover AI tools with active Discord communities.',
        type: 'website',
    },
};

// ISR revalidation every 30 minutes
export const revalidate = 1800;

export default async function DiscordPage() {
    const tools = await getDiscordToolsForPage();

    return (
        <div className="min-h-screen py-8">
            <Container>
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-[#5865F2]/10 rounded-lg">
                            <MessageCircle className="w-6 h-6 text-[#5865F2]" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">AI Discord Communities</h1>
                    </div>
                    <p className="text-gray-600 max-w-2xl">
                        Join Discord communities for popular AI tools. Get support, share tips, and connect with other users.
                    </p>
                </div>

                {/* Tools Grid */}
                {tools.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">No Discord communities yet</h2>
                        <p className="text-gray-500 mb-4">Check back soon for AI Discord communities.</p>
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
                            <DiscordToolCard key={tool.id} {...tool} />
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
