/**
 * New Prompt Page
 *
 * Page for creating a new Midjourney prompt.
 *
 * Requirements: 8.4, 8.6
 */

import { PromptForm } from '@/components/admin/PromptForm';

export default function NewPromptPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Create Prompt</h2>
        <p className="text-gray-500 mt-1">
          Add a new Midjourney prompt or SREF code
        </p>
      </div>

      <PromptForm isNew={true} />
    </div>
  );
}
