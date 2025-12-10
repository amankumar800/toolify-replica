import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { getPromptById, getRelatedPrompts } from '@/lib/services/prompt.service';
import { Container } from '@/components/layout/Container';
import { MasonryGrid } from '@/components/features/MasonryGrid';
import { PromptCard } from '@/components/features/PromptCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Share2, Heart, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const prompt = await getPromptById(id);
    if (!prompt) return {};

    return {
        title: `${prompt.promptText.slice(0, 50)}... - Midjourney Library`,
        description: `Midjourney prompt: ${prompt.promptText}`,
        openGraph: {
            title: 'Midjourney Prompt',
            description: prompt.promptText,
            images: [prompt.imageUrl],
        },
    };
}

export default async function PromptDetailPage({ params }: PageProps) {
    const { id } = await params;
    const prompt = await getPromptById(id);

    if (!prompt) {
        notFound();
    }

    const relatedPrompts = await getRelatedPrompts(prompt);

    return (
        <div className="bg-[#0b0f19] min-h-screen text-white pb-20">
            {/* Nav */}
            <div className="border-b border-gray-800 bg-[#0b0f19]/50 backdrop-blur sticky top-0 z-10">
                <Container fluid className="py-4 px-6 md:px-8">
                    <Link href="/midjourney-library" className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Library
                    </Link>
                </Container>
            </div>

            <Container fluid className="px-4 md:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                    {/* Left: Image Canvas */}
                    <div className="lg:col-span-8 flex justify-center bg-[#131b2c] rounded-2xl border border-gray-800 p-4 md:p-8 min-h-[500px] items-center">
                        <div className="relative w-full h-full max-h-[80vh] aspect-auto flex items-center justify-center">
                            <Image
                                src={prompt.imageUrl}
                                alt={prompt.promptText}
                                width={1024}
                                height={1024}
                                className="rounded-lg shadow-2xl max-w-full max-h-[70vh] w-auto h-auto object-contain"
                                priority
                            />
                        </div>
                    </div>

                    {/* Right: Prompt Details */}
                    <div className="lg:col-span-4 space-y-8">
                        <div>
                            <h1 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                Midjourney Prompt
                            </h1>
                            <div className="bg-[#1a2333] rounded-xl p-4 border border-gray-700 font-mono text-sm text-gray-300 leading-relaxed break-words relative group">
                                {prompt.promptText}
                                <Button
                                    size="sm"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Copy className="w-3 h-3 mr-1" /> Copy
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1 bg-[#1a2333] rounded-xl p-4 border border-gray-700 flex flex-col items-center justify-center gap-1">
                                <span className="text-gray-400 text-xs uppercase tracking-wider">Parameters</span>
                                <span className="font-mono text-blue-400 font-bold">--v 5.2</span>
                            </div>
                            <div className="flex-1 bg-[#1a2333] rounded-xl p-4 border border-gray-700 flex flex-col items-center justify-center gap-1">
                                <span className="text-gray-400 text-xs uppercase tracking-wider">Aspect Ratio</span>
                                <span className="font-mono text-purple-400 font-bold">{prompt.aspectRatio}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {prompt.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-gray-400 border-gray-700 hover:text-white hover:border-gray-500 cursor-pointer">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-800 flex items-center justify-between text-gray-400 text-sm">
                            <div className="flex items-center gap-2">
                                <span>By @{prompt.author}</span>
                                <span>•</span>
                                <span>{new Date(prompt.dateAdded).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1"><Heart className="w-4 h-4" /> {prompt.likes}</div>
                                <div className="flex items-center gap-1"><Eye className="w-4 h-4" /> {(prompt.likes * 12).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Section */}
                <div className="mt-20">
                    <h2 className="text-2xl font-bold mb-8 text-white">More like this</h2>
                    <MasonryGrid>
                        {relatedPrompts.map(p => (
                            <PromptCard key={p.id} prompt={p} />
                        ))}
                    </MasonryGrid>
                </div>
            </Container>
        </div>
    );
}
