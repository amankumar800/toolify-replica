/**
 * Create New AI News Page
 *
 * Admin page for creating new AI news articles.
 *
 * Requirements: 7.6
 */

import { NewsForm } from '@/components/admin/NewsForm';

export default function NewNewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Create News Article</h2>
        <p className="text-gray-500 mt-1">
          Add a new AI news article to the platform
        </p>
      </div>

      <NewsForm isNew={true} />
    </div>
  );
}
