import { Container } from '@/components/layout/Container';
import { MasonryGrid } from '@/components/features/MasonryGrid';
import { PromptCard } from '@/components/features/PromptCard';
import { getPrompts } from '@/lib/services/prompt.service';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'The Ultimate Midjourney SREF, Prompt, and Style Library (2025)',
    description: 'Explore thousands of Midjourney styles, prompts, and references.',
};

export default async function MidjourneyPage() {
    const prompts = await getPrompts(50);

    return (
        <div className="pb-20">
            <div className="bg-gray-900 border-b border-gray-800 py-16 mb-8 text-white">
                <Container className="text-center">
                    <h1 className="text-3xl md:text-5xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Midjourney Style & Prompt Library
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-8">
                        The most comprehensive collection of aesthetic styles, SREF codes, and high-quality prompts for your next AI art creation.
                    </p>

                    {/* Placeholder Filters */}
                    <div className="flex flex-wrap justify-center gap-2">
                        {['All', 'Photorealistic', 'Anime', '3D Render', 'Logo Design', 'UI', 'Architecture'].map(filter => (
                            <button key={filter} className="px-4 py-2 rounded-full border border-gray-700 hover:bg-gray-800 transition-colors text-sm">
                                {filter}
                            </button>
                        ))}
                    </div>
                </Container>
            </div>

            <Container fluid className="px-4">
                <MasonryGrid>
                    {prompts.map(prompt => (
                        <PromptCard key={prompt.id} prompt={prompt} />
                    ))}
                </MasonryGrid>
            </Container>
        </div>
    );
}
