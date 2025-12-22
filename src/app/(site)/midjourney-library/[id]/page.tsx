import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { getPromptById, getRelatedPrompts, getAdjacentPrompts } from '@/lib/services/prompt.service';
import { Container } from '@/components/layout/Container';
import { MasonryGrid } from '@/components/features/MasonryGrid';
import { PromptCard } from '@/components/features/PromptCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Heart, Eye, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    HowToUse,
    ImageGallery,
    PrevNextNav,
    SocialShare
} from '@/components/features/midjourney';
import { DetailPageClient } from './DetailPageClient';

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const prompt = await getPromptById(id);
    if (!prompt) return {};

    const title = prompt.srefCode
        ? `--sref ${prompt.srefCode} - Midjourney Style`
        : `${prompt.styleTitle || prompt.promptText.slice(0, 50)}... - Midjourney Library`;

    return {
        title,
        description: prompt.styleDescription || `Midjourney prompt: ${prompt.promptText}`,
        openGraph: {
            title: prompt.styleTitle || 'Midjourney Style',
            description: prompt.styleDescription || prompt.promptText,
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

    const [relatedPrompts, adjacent] = await Promise.all([
        getRelatedPrompts(prompt),
        getAdjacentPrompts(id)
    ]);

    return (
        <div className="bg-[#0b0f19] min-h-screen text-white pb-20">
            {/* Nav */}
            <div className="border-b border-gray-800 bg-[#0b0f19]/80 backdrop-blur sticky top-0 z-10">
                <Container fluid className="py-4 px-6 md:px-8 flex items-center justify-between">
                    <Link href="/midjourney-library" className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
                    </Link>
                    <SocialShare />
                </Container>
            </div>

            <Container fluid className="px-4 md:px-8 py-8">
                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                    {/* Left: Image Gallery */}
                    <div className="lg:col-span-7">
                        <ImageGallery
                            images={prompt.galleryImages?.length ? prompt.galleryImages : [prompt.imageUrl]}
                            alt={prompt.styleTitle || prompt.promptText}
                        />
                    </div>

                    {/* Right: Prompt Details */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Style Title */}
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                {prompt.styleTitle || 'Midjourney Style'}
                            </h1>
                            <p className="text-gray-400 text-sm">
                                {prompt.category} • Created by @{prompt.author}
                            </p>
                        </div>

                        {/* SREF Code Box */}
                        {prompt.srefCode && (
                            <DetailPageClient srefCode={prompt.srefCode} promptText={prompt.promptText} />
                        )}

                        {/* If no SREF, show prompt */}
                        {!prompt.srefCode && (
                            <div className="bg-[#1a2333] rounded-xl p-4 border border-gray-700">
                                <span className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Prompt</span>
                                <p className="font-mono text-sm text-gray-300 leading-relaxed">
                                    {prompt.promptText}
                                </p>
                            </div>
                        )}

                        {/* Style Description */}
                        {prompt.styleDescription && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">About This Style</h3>
                                <p className="text-gray-300 leading-relaxed">
                                    {prompt.styleDescription}
                                </p>
                            </div>
                        )}

                        {/* Parameters & Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#1a2333] rounded-xl p-4 border border-gray-700 flex flex-col items-center justify-center gap-1">
                                <span className="text-gray-400 text-xs uppercase tracking-wider">Parameters</span>
                                <span className="font-mono text-blue-400 font-bold">--v 5.2</span>
                            </div>
                            <div className="bg-[#1a2333] rounded-xl p-4 border border-gray-700 flex flex-col items-center justify-center gap-1">
                                <span className="text-gray-400 text-xs uppercase tracking-wider">Aspect Ratio</span>
                                <span className="font-mono text-purple-400 font-bold capitalize">{prompt.aspectRatio}</span>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {prompt.tags.map(tag => (
                                    <Badge
                                        key={tag}
                                        variant="outline"
                                        className="text-gray-400 border-gray-700 hover:text-white hover:border-purple-500 cursor-pointer transition-colors capitalize"
                                    >
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="pt-4 border-t border-gray-800 flex items-center justify-between text-gray-400 text-sm">
                            <span>{new Date(prompt.dateAdded).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Heart className="w-4 h-4" /> {prompt.likes.toLocaleString()}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4" /> {prompt.views.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* How to Use Section */}
                <HowToUse className="mt-16" />

                {/* Previous/Next Navigation */}
                <div className="mt-12">
                    <PrevNextNav prev={adjacent.prev} next={adjacent.next} />
                </div>

                {/* Related Section */}
                <div className="mt-20">
                    <h2 className="text-2xl font-bold mb-8 text-white">More Styles Like This</h2>
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
