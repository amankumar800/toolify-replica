/**
 * Edit AI News Page
 *
 * Admin page for editing existing AI news articles.
 *
 * Requirements: 7.6, 7.7
 */

import { notFound } from 'next/navigation';
import { NewsForm } from '@/components/admin/NewsForm';
import { getNewsById } from '@/lib/services/news.service';
import type { AINewsFormData } from '@/lib/types/admin-forms';

interface EditNewsPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditNewsPage({ params }: EditNewsPageProps) {
  const { id } = await params;
  const news = await getNewsById(id);

  if (!news) {
    notFound();
  }

  // Transform database row to form data
  const initialData: AINewsFormData & {
    id: string;
    created_at?: string;
    updated_at?: string;
    view_count?: number;
    like_count?: number;
  } = {
    id: news.id,
    title: news.title,
    slug: news.slug,
    content: news.content ?? '',
    summary: news.summary ?? '',
    author_name: news.author_name ?? '',
    author_avatar: news.author_avatar ?? '',
    source_name: news.source_name ?? '',
    source_url: news.source_url ?? '',
    category: news.category as AINewsFormData['category'],
    tags: news.tags ?? [],
    is_published: news.is_published ?? false,
    published_at: news.published_at ? new Date(news.published_at) : undefined,
    priority_score: news.priority_score ?? 0,
    created_at: news.created_at ?? undefined,
    updated_at: news.updated_at ?? undefined,
    view_count: news.view_count ?? 0,
    like_count: news.like_count ?? 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Edit News Article</h2>
        <p className="text-gray-500 mt-1">
          Update the news article details
        </p>
      </div>

      <NewsForm initialData={initialData} isNew={false} />
    </div>
  );
}
