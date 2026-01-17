/**
 * Tool Edit Page
 *
 * Server component that fetches tool data and renders the edit form.
 *
 * Requirements: 3.8, 3.9, 18.1, 18.3
 */

import { notFound } from 'next/navigation';
import { ToolForm } from '@/components/admin/ToolForm';
import { getToolById, getAllCategories, checkForDuplicates } from '@/lib/services/tools.service';

interface EditToolPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditToolPage({ params }: EditToolPageProps) {
  const { id } = await params;

  // Fetch tool data
  const tool = await getToolById(id);

  if (!tool) {
    notFound();
  }

  // Fetch categories for multi-select
  const categories = await getAllCategories();

  // Transform tool data for form
  const initialData = {
    id: tool.id,
    name: tool.name,
    slug: tool.slug,
    website_url: tool.website_url,
    description: tool.description ?? '',
    short_description: tool.short_description ?? '',
    image_url: tool.image_url ?? '',
    pricing: tool.pricing as 'free' | 'freemium' | 'paid' | 'contact' | undefined,
    status: tool.status as 'draft' | 'pending' | 'published' | 'rejected' | 'archived' | undefined,
    is_featured: tool.is_featured ?? false,
    is_new: tool.is_new ?? false,
    verified: tool.verified ?? false,
    tags: tool.tags ?? [],
    category_ids: tool.categories?.map((c) => c.id) ?? [],
    monthly_visits: tool.monthly_visits ?? undefined,
    review_score: tool.review_score ?? undefined,
    review_count: tool.review_count ?? undefined,
    metadata: (tool.metadata as Record<string, unknown>) ?? {},
    submitter_name: tool.submitter_name ?? '',
    submitter_email: tool.submitter_email ?? '',
    rejection_reason: tool.rejection_reason ?? '',
    // Discord community
    discord_url: tool.discord_url ?? '',
    discord_members: tool.discord_members ?? undefined,
    discord_online_7d: tool.discord_online_7d ?? undefined,
    created_at: tool.created_at ?? undefined,
    updated_at: tool.updated_at ?? undefined,
    categories: tool.categories,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Edit Tool</h2>
        <p className="text-gray-500 mt-1">Update tool information</p>
      </div>

      <ToolForm
        initialData={initialData}
        categories={categories}
        isNew={false}
      />
    </div>
  );
}
