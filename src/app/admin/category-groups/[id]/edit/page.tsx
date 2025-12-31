/**
 * Category Group Edit Page
 *
 * Server component that fetches category group data and renders the edit form.
 *
 * Requirements: 4.4
 */

import { notFound } from 'next/navigation';
import { CategoryGroupForm } from '@/components/admin/CategoryGroupForm';
import { createClient } from '@/lib/supabase/server';
import { createCategoryGroupsRepository } from '@/lib/db/repositories';

interface EditCategoryGroupPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryGroupPage({ params }: EditCategoryGroupPageProps) {
  const { id } = await params;

  // Fetch category group data
  const supabase = await createClient();
  const repo = createCategoryGroupsRepository(supabase);

  let group;
  try {
    group = await repo.findById(id);
  } catch {
    notFound();
  }

  if (!group) {
    notFound();
  }

  // Transform data for form
  const initialData = {
    id: group.id,
    name: group.name,
    icon_name: group.icon_name,
    display_order: group.display_order,
    created_at: group.created_at,
    updated_at: group.updated_at,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Edit Category Group</h2>
        <p className="text-gray-500 mt-1">Update category group information</p>
      </div>

      <CategoryGroupForm initialData={initialData} isNew={false} />
    </div>
  );
}
