/**
 * Create Featured Tool Page
 *
 * Admin page for creating new featured tools.
 *
 * Requirements: 10.5
 */

import { FeaturedToolForm } from '@/components/admin/FeaturedToolForm';

export default function NewFeaturedToolPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Add Featured Tool</h2>
        <p className="text-gray-500 mt-1">
          Create a new featured tool placement
        </p>
      </div>

      <FeaturedToolForm isNew={true} />
    </div>
  );
}
