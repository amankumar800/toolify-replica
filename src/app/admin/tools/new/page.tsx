/**
 * New Tool Page
 *
 * Server component that renders the tool creation form.
 *
 * Requirements: 3.8, 21.1-21.5
 */

import { ToolForm } from '@/components/admin/ToolForm';
import { getAllCategories } from '@/lib/services/tools.service';

export default async function NewToolPage() {
  // Fetch categories for multi-select
  const categories = await getAllCategories();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Add New Tool</h2>
        <p className="text-gray-500 mt-1">Create a new AI tool listing</p>
      </div>

      <ToolForm
        categories={categories}
        isNew={true}
      />
    </div>
  );
}
