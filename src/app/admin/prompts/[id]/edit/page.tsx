/**
 * Edit Prompt Page
 *
 * Page for editing an existing Midjourney prompt.
 *
 * Requirements: 8.4, 8.5, 8.6
 */

import { notFound } from 'next/navigation';
import { PromptForm } from '@/components/admin/PromptForm';
import { getPromptById } from '@/lib/services/prompts.service';
import type { PromptFormData, PromptType } from '@/lib/types/admin-forms';

interface EditPromptPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPromptPage({ params }: EditPromptPageProps) {
  const { id } = await params;
  const prompt = await getPromptById(id);

  if (!prompt) {
    notFound();
  }

  // Transform database row to form data
  const initialData: PromptFormData & {
    id: string;
    created_at?: string;
    updated_at?: string;
    view_count?: number;
    copy_count?: number;
  } = {
    id: prompt.id,
    title: prompt.title,
    slug: prompt.slug,
    type: prompt.type as PromptType,
    prompt_text: prompt.prompt_text ?? '',
    sref_code: prompt.sref_code ?? '',
    image_url: prompt.image_url ?? '',
    tags: prompt.tags ?? [],
    created_at: prompt.created_at ?? undefined,
    updated_at: prompt.updated_at ?? undefined,
    view_count: prompt.view_count ?? 0,
    copy_count: prompt.copy_count ?? 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Edit Prompt</h2>
        <p className="text-gray-500 mt-1">
          Update prompt details and content
        </p>
      </div>

      <PromptForm initialData={initialData} isNew={false} />
    </div>
  );
}
