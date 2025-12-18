import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getToolBySlug } from '@/lib/services/tools.service';
import { Container } from '@/components/layout/Container';
import { Share2, Bookmark, Star, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';

interface PageProps {
    params: Promise<{ slug: string }>;
}

/**
 * Converts a slug to a human-readable search query
 * Per Requirement 14.7: Redirect to search with tool name as query
 */
function slugToSearchQuery(slug: string): string {
    return slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const tool = await getToolBySlug(slug);
    if (!tool) return {};

    return {
        title: tool.name,
        description: tool.description,
        openGraph: {
            title: `${tool.name} - ${tool.shortDescription}`,
            description: tool.description,
            images: [tool.image],
        },
    };
}

export default async function ToolPage({ params }: PageProps) {
    const { slug } = await params;
    const tool = await getToolBySlug(slug);

    // Per Requirement 14.7: Redirect to search results page when tool doesn't exist
    if (!tool) {
        const searchQuery = slugToSearchQuery(slug);
        redirect(`/?search=${encodeURIComponent(searchQuery)}`);
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Breadcrumb / Header Area */}
            <div className="bg-white border-b border-[var(--border)] py-8">
                <Container>
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Icon */}
                        <div className="relative w-24 h-24 rounded-[var(--radius)] overflow-hidden border border-[var(--border)] flex-shrink-0 bg-white shadow-sm">
                            <Image
                                src={tool.image}
                                alt={tool.name}
                                fill
                                className="object-cover"
                                sizes="96px"
                                priority
                            />
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h1 className="text-3xl font-bold text-gray-900">{tool.name}</h1>
                                <div className="flex gap-3">
                                    <button type="button" className="flex items-center gap-2 px-4 py-2 bg-white border border-[var(--border)] rounded-[var(--radius-sm)] shadow-sm hover:bg-gray-50 font-medium text-sm text-gray-700">
                                        <Share2 className="w-4 h-4" /> Share
                                    </button>
                                    <button type="button" className="flex items-center gap-2 px-4 py-2 bg-white border border-[var(--border)] rounded-[var(--radius-sm)] shadow-sm hover:bg-gray-50 font-medium text-sm text-gray-700">
                                        <Bookmark className="w-4 h-4" /> Save ({tool.savedCount})
                                    </button>
                                    <a
                                        href={tool.websiteUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-6 py-2 bg-[var(--primary)] text-white rounded-[var(--radius-sm)] shadow-md hover:bg-opacity-90 font-medium text-sm transition-opacity"
                                    >
                                        Visit Website <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>

                            <p className="text-lg text-gray-600 mt-2">{tool.shortDescription}</p>

                            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
                                <div className="flex items-center text-yellow-500">
                                    <Star className="w-4 h-4 fill-current" />
                                    <span className="ml-1 font-semibold text-gray-900">{tool.reviewScore}</span>
                                    <span className="ml-1 text-gray-400">({tool.reviewCount} reviews)</span>
                                </div>
                                <span className="bg-purple-100 text-[var(--primary)] px-2 py-0.5 rounded text-xs font-semibold">
                                    {tool.pricing}
                                </span>
                                {tool.categories.map(cat => (
                                    <span key={cat} className="text-gray-500 underline decoration-gray-300 hover:text-[var(--primary)] cursor-pointer">
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </Container>
            </div>

            <Container className="mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Description */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-[var(--radius)] border border-[var(--border)] p-8 shadow-sm">
                            <h2 className="text-xl font-bold mb-4">About {tool.name}</h2>
                            <div className="prose max-w-none text-gray-600 leading-relaxed">
                                <p>{tool.description}</p>
                                <p className="mt-4">
                                    (This is a placeholder for enriched content. In a real app, this would be markdown rendered content describing {tool.name}&apos;s features, pricing tiers, and use cases.)
                                </p>
                            </div>
                        </div>

                        {/* Reviews Section Placeholder */}
                        <div className="bg-white rounded-[var(--radius)] border border-[var(--border)] p-8 shadow-sm">
                            <h2 className="text-xl font-bold mb-4">User Reviews</h2>
                            <div className="space-y-4">
                                {[1, 2].map(i => (
                                    <div key={i} className="border-b border-[var(--border)] pb-4 last:border-0 last:pb-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-gray-900">User {i}</span>
                                            <div className="flex text-yellow-400"><Star className="w-3 h-3 fill-current" /> <Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /></div>
                                        </div>
                                        <p className="text-sm text-gray-600">Great tool, really helped my workflow!</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[var(--radius)] border border-[var(--border)] p-6 shadow-sm">
                            <h3 className="font-semibold mb-4">Details</h3>
                            <dl className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Pricing</dt>
                                    <dd className="font-medium">{tool.pricing}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Verified</dt>
                                    <dd className="font-medium text-blue-600">{tool.verified ? 'Yes' : 'No'}</dd>
                                </div>
                                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                                    <dt className="text-gray-500 mb-2">Tags</dt>
                                    <dd className="flex flex-wrap gap-2">
                                        {tool.tags.map(tag => (
                                            <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                                #{tag}
                                            </span>
                                        ))}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[var(--radius)] p-6 text-white text-center">
                            <h3 className="font-bold text-lg mb-2">Submit your Tool</h3>
                            <p className="text-purple-100 text-sm mb-4">Get in front of 1M+ AI enthusiasts per month.</p>
                            <button type="button" className="bg-white text-[var(--primary)] font-bold py-2 px-4 rounded-[var(--radius-sm)] w-full hover:bg-gray-50">
                                Submit Now
                            </button>
                        </div>
                    </div>
                </div>
            </Container>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'SoftwareApplication',
                        name: tool.name,
                        applicationCategory: tool.categories[0],
                        operatingSystem: 'Web',
                        offers: {
                            '@type': 'Offer',
                            price: tool.pricing === 'Free' ? '0' : '0',
                            priceCurrency: 'USD',
                        },
                        aggregateRating: {
                            '@type': 'AggregateRating',
                            ratingValue: tool.reviewScore,
                            reviewCount: tool.reviewCount,
                        },
                    }),
                }}
            />
        </div>
    );
}
