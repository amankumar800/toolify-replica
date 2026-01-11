'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { useToast } from '@/components/admin/Toast';
import { createLogger } from '@/lib/logger';
import { Loader2 } from 'lucide-react';

const log = createLogger('EditCategoryPage');

// ============================================================================
// Types
// ============================================================================

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
  tool_count?: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Edit Category Page
 * 
 * Requirements: 5.5, 5.6
 * - Implement all fields
 * - Display read-only tool_count
 */
export default function EditCategoryPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  const [category, setCategory] = useState<CategoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategory() {
      try {
        const response = await fetch(`/api/admin/categories/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Category not found');
          } else {
            throw new Error('Failed to fetch category');
          }
          return;
        }

        const data = await response.json();
        setCategory(data);
      } catch (err) {
        log.error('Error fetching category', err, { action: 'fetchCategory' });
        setError('Failed to load category');
        addToast({
          variant: 'error',
          message: 'Failed to load category. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategory();
  }, [id, addToast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-500">Loading category...</p>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Category not found'}
          </h2>
          <p className="text-gray-500 mb-4">
            The category you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <button
            onClick={() => router.push('/admin/categories')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Categories
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Edit Category</h2>
        <p className="text-gray-500 mt-1">
          Update category: <span className="font-medium">{category.name}</span>
        </p>
      </div>

      {/* Form */}
      <CategoryForm
        initialData={category}
        isNew={false}
      />
    </div>
  );
}
