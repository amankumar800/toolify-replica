import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Share2, ExternalLink } from 'lucide-react';

import { NewsService } from '@/lib/services/news.service';
import { NewsSidebar } from '@/components/features/news/NewsSidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export async function generateMetadata(
    props: {
        params: Promise<{ slug: string }>;
    }
): Promise<Metadata> {
    const params = await props.params;
    const news = await NewsService.getNewsBySlug(params.slug);

    if (!news) {
        return {
            title: 'News Not Found',
        };
    }

    return {
        title: `${news.title} | Toolify AI News`,
        description: news.summary,
        openGraph: {
            title: news.title,
            description: news.summary,
            images: news.image ? [news.image] : [],
            type: 'article',
            publishedTime: news.date,
            authors: [news.author.name],
        },
    };
}

export default async function NewsDetailPage(
    props: {
        params: Promise<{ slug: string }>;
    }
) {
    const params = await props.params;
    const { slug } = params;
    const news = await NewsService.getNewsBySlug(slug);

    if (!news) {
        notFound();
    }

    const relatedNews = await NewsService.getRelatedNews(slug);

    // Simplified Markdown rendering (in real app us react-markdown)
    const renderContent = (content: string) => {
        return content.split('\n\n').map((paragraph, idx) => {
            if (paragraph.startsWith('## ')) {
                return <h2 key={idx} className="text-2xl font-bold mt-8 mb-4">{paragraph.replace('## ', '')}</h2>;
            }
            if (paragraph.startsWith('### ')) {
                return <h3 key={idx} className="text-xl font-bold mt-6 mb-3">{paragraph.replace('### ', '')}</h3>;
            }
            if (paragraph.startsWith('* ')) {
                const items = paragraph.split('\n').map(line => line.replace('* ', ''));
                return (
                    <ul key={idx} className="list-disc pl-6 space-y-2 mb-4">
                        {items.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                );
            }
            return <p key={idx} className="mb-4 leading-relaxed text-lg text-foreground/90">{paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>;
        });
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb / Back */}
            <div className="mb-6">
                <Link
                    href="/ai-news"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to AI News
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Main Article */}
                <article className="lg:col-span-8">
                    <header className="mb-8">
                        <div className="flex gap-2 mb-4">
                            {news.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                                    {tag}
                                </Badge>
                            ))}
                        </div>

                        <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                            {news.title}
                        </h1>

                        <div className="flex items-center justify-between py-6 border-y">
                            <div className="flex items-center gap-4">
                                {/* Author Avatar Placeholder */}
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                                    {news.author.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-medium text-foreground">{news.author.name}</div>
                                    <div className="text-xs text-muted-foreground flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {format(new Date(news.date), 'MMMM d, yyyy')}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </Button>
                                {news.source?.url && (
                                    <Button variant="default" size="sm" asChild>
                                        <Link href={news.source.url} target="_blank">
                                            Source
                                            <ExternalLink className="w-4 h-4 ml-2" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </header>

                    {news.image && (
                        <div className="relative w-full h-[400px] rounded-xl overflow-hidden mb-8 shadow-md">
                            <Image
                                src={news.image}
                                alt={news.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}

                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        {/* Dangerously simple rendering for demo purposes - use markdown parser in prod */}
                        {/* <div dangerouslySetInnerHTML={{ __html: news.content }} /> */}
                        {renderContent(news.content)}
                    </div>
                </article>

                {/* Sidebar */}
                <aside className="lg:col-span-4 space-y-8">
                    <NewsSidebar news={relatedNews} title="Related News" />

                    {/* Ad Placeholder or Promo */}
                    <div className="bg-muted h-64 rounded-xl flex items-center justify-center border border-dashed">
                        <span className="text-muted-foreground font-medium">Ad Space / Promo</span>
                    </div>
                </aside>
            </div>
        </div>
    );
}
