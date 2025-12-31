/**
 * Edit Featured Tool Page
 *
 * Admin page for editing existing featured tools.
 *
 * Requirements: 10.5, 10.6
 */

import { notFound } from 'next/navigation';
import { FeaturedToolForm } from '@/components/admin/FeaturedToolForm';
import { getFeaturedToolById } from '@/lib/services/featured-tools.service';
import type { FeaturedToolFormData } from '@/lib/types/admin-forms';

interface EditFeaturedToolPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFeaturedToolPage({ params }: EditFeaturedToolPageProps) {
  const { id } = await params;
  const featuredTool = await getFeaturedToolById(id);

  if (!featuredTool) {
    notFound();
  }

  // Transform database row to form data
  const initialData: FeaturedToolFormData & {
    id: string;
    tool_name?: string;
    created_at?: string;
    updated_at?: string;
    impression_count?: number;
    click_count?: number;
  } = {
    id: featuredTool.id,
    tool_id: featuredTool.tool_id,
    tool_name: featuredTool.tool_name,
    placement_type: featuredTool.placement_type as FeaturedToolFormData['placement_type'],
    is_sponsored: featuredTool.is_sponsored ?? false,
    sponsor_name: featuredTool.sponsor_name ?? '',
    campaign_id: featuredTool.campaign_id ?? '',
    start_date: featuredTool.start_date ? new Date(featuredTool.start_date) : undefined,
    end_date: featuredTool.end_date ? new Date(featuredTool.end_date) : undefined,
    display_order: featuredTool.display_order ?? undefined,
    created_at: featuredTool.created_at ?? undefined,
    updated_at: featuredTool.updated_at ?? undefined,
    impression_count: featuredTool.impression_count ?? 0,
    click_count: featuredTool.click_count ?? 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Edit Featured Tool</h2>
        <p className="text-gray-500 mt-1">
          Update the featured tool details for &quot;{featuredTool.tool_name}&quot;
        </p>
      </div>

      <FeaturedToolForm initialData={initialData} isNew={false} />
    </div>
  );
}
