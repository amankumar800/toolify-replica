'use client';

import { SubcategoryForm } from '@/components/admin/SubcategoryForm';

/**
 * Create New Subcategory Page
 * 
 * Requirements: 6.5
 */
export default function NewSubcategoryPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Create Subcategory</h2>
        <p className="text-gray-500 mt-1">
          Add a new subcategory under a parent category
        </p>
      </div>

      {/* Form */}
      <SubcategoryForm isNew />
    </div>
  );
}
