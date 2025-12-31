'use client';

import { FAQForm } from '@/components/admin/FAQForm';

/**
 * Create New FAQ Page
 *
 * Renders the FAQ form for creating a new FAQ entry.
 *
 * Requirements: 9.5
 */
export default function NewFAQPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Create FAQ</h2>
        <p className="text-gray-500 mt-1">
          Add a new frequently asked question
        </p>
      </div>

      {/* FAQ Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <FAQForm isNew={true} />
      </div>
    </div>
  );
}
