'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { SubcategoryForm } from '@/components/admin/SubcategoryForm';
import { useToast } from '@/components/admin/Toast';
import { Loader2 } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SubcategoryData {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  tool_count: number | null;
  display_order: number | null;
  created_at: string | null;
  updated_at: string | null;
  category: Category | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Edit Subcategory Page
 * 
 * Requirements: 6.5, 6.6
 * - Implement all fields including category_id select (required)
 * - Display read-only tool_count
 */
export default function EditSubcategoryPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  const [subcategory, setSubcategory] = useState<SubcategoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubcategory() {
      try {
        const response = await fetch(`/api/admin/subcategories/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Subcategory not found');
          } else {
            throw new Error('Failed to fetch subcategory');
          }
          return;
        }

        const data = await response.json();
        setSubcategory(data);
      } catch (err) {
        console.error('Error fetching subcategory:', err);
        setError('Failed to load subcategory');
        addToast({
          variant: 'error',
          message: 'Failed to load subcategory. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubcategory();
  }, [id, addToast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-500">Loading subcategory...</p>
        </div>
      </div>
    );
  }

  if (error || !subcategory) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Subcategory not found'}
          </h2>
          <p className="text-gray-500 mb-4">
            The subcategory you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <button
            onClick={() => router.push('/admin/subcategories')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Subcategories
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Edit Subcategory</h2>
        <p className="text-gray-500 mt-1">
          Update subcategory: <span className="font-medium">{subcategory.name}</span>
        </p>
      </div>

      {/* Form */}
      <SubcategoryForm
        initialData={{
          ...subcategory,
          tool_count: subcategory.tool_count ?? 0,
        }}
        isNew={false}
      />
    </div>
  );
}
