import { Suspense } from 'react';
import { Container } from '@/components/layout/Container';
import { getPrompts, getTagCounts, getFilterGroups, getFAQs } from '@/lib/services/prompt.service';
import { Metadata } from 'next';
import { MidjourneyLibraryClient } from './MidjourneyLibraryClient';

export const metadata: Metadata = {
    title: 'The Ultimate Midjourney SREF, Prompt, and Style Library (2025) | AI Tools Book',
    description: 'Explore thousands of Midjourney styles, SREF codes, and high-quality prompts. The most comprehensive collection of aesthetic styles for your next AI art creation.',
    openGraph: {
        title: 'The Ultimate Midjourney SREF, Prompt, and Style Library (2025)',
        description: 'Explore thousands of Midjourney styles, SREF codes, and prompts.',
        type: 'website',
    }
};

function LoadingSkeleton() {
    return (
        <div className="min-h-screen bg-[#0b0f19]">
            {/* Hero Skeleton */}
            <div className="bg-gradient-to-br from-purple-900/50 via-[#0b0f19] to-blue-900/30 border-b border-gray-800 py-10 md:py-16">
                <Container className="text-center">
                    <div className="h-4 w-32 bg-gray-800 rounded mx-auto mb-6 animate-pulse" />
                    <div className="h-12 w-3/4 max-w-2xl bg-gray-800 rounded mx-auto mb-4 animate-pulse" />
                    <div className="h-6 w-2/3 max-w-xl bg-gray-800 rounded mx-auto mb-8 animate-pulse" />
                    <div className="h-14 w-full max-w-2xl bg-gray-800 rounded-full mx-auto animate-pulse" />
                </Container>
            </div>

            {/* Content Skeleton */}
            <Container fluid className="px-4 md:px-8 py-8">
                {/* Tags skeleton */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-10 w-24 bg-gray-800 rounded-full animate-pulse" />
                    ))}
                </div>

                {/* Grid skeleton */}
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="mb-4 break-inside-avoid">
                            <div className="rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
                                <div className="aspect-square bg-gray-800 animate-pulse" />
                                <div className="p-4 space-y-3">
                                    <div className="h-5 w-3/4 bg-gray-800 rounded animate-pulse" />
                                    <div className="flex gap-2">
                                        <div className="h-6 w-16 bg-gray-800 rounded-full animate-pulse" />
                                        <div className="h-6 w-16 bg-gray-800 rounded-full animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Container>

            {/* Loading indicator */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-purple-600 text-white text-sm rounded-full shadow-lg flex items-center gap-2 z-50">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Loading Midjourney styles and prompts...
            </div>
        </div>
    );
}

async function MidjourneyContent() {
    const [prompts, tagCounts, filterGroups, faqs] = await Promise.all([
        getPrompts(50),
        getTagCounts(),
        getFilterGroups(),
        getFAQs()
    ]);

    return (
        <MidjourneyLibraryClient
            initialPrompts={prompts}
            tagCounts={tagCounts}
            filterGroups={filterGroups}
            faqs={faqs}
        />
    );
}

export default function MidjourneyPage() {
    return (
        <Suspense fallback={<LoadingSkeleton />}>
            <MidjourneyContent />
        </Suspense>
    );
}
