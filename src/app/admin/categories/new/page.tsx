'use client';

import { CategoryForm } from '@/components/admin/CategoryForm';

/**
 * Create New Category Page
 * 
 * Requirements: 5.5
 */
export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Create Category</h2>
        <p className="text-gray-500 mt-1">
          Add a new category to organize tools
        </p>
      </div>

      {/* Form */}
      <CategoryForm isNew />
    </div>
  );
}
