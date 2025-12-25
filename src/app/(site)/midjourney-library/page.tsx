import { Suspense } from 'react';
import { Container } from '@/components/layout/Container';
import { MasonryGrid } from '@/components/features/MasonryGrid';
import { PromptCard } from '@/components/features/PromptCard';
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
        <Suspense fallback={
            <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading library...</div>
            </div>
        }>
            <MidjourneyContent />
        </Suspense>
    );
}
