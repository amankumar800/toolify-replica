/**
 * New Category Group Page
 *
 * Server component that renders the category group creation form.
 *
 * Requirements: 4.4
 */

import { CategoryGroupForm } from '@/components/admin/CategoryGroupForm';

export default function NewCategoryGroupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Add Category Group</h2>
        <p className="text-gray-500 mt-1">Create a new category group</p>
      </div>

      <CategoryGroupForm isNew={true} />
    </div>
  );
}
