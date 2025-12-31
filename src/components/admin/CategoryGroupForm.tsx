'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/admin/form-fields/TextField';
import { NumberField } from '@/components/admin/form-fields/NumberField';
import { IconPickerField } from '@/components/admin/form-fields/IconPickerField';
import { useToast } from '@/components/admin/Toast';
import { RelatedDataSection, type RelatedDataItem } from '@/components/admin/RelatedDataSection';
import { categoryGroupSchema, validateFormData } from '@/lib/utils/admin-validation';
import type { CategoryGroupFormData } from '@/lib/types/admin-forms';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

interface CategoryGroupFormProps {
  initialData?: {
    id: string;
    name: string;
    icon_name: string | null;
    display_order: number | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  isNew: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function CategoryGroupForm({ initialData, isNew }: CategoryGroupFormProps) {
  const router = useRouter();
  const { addToast } = useToast();

  // Form state
  const [formData, setFormData] = useState<CategoryGroupFormData>({
    name: initialData?.name ?? '',
    icon_name: initialData?.icon_name ?? undefined,
    display_order: initialData?.display_order ?? undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Related categories state (Requirements: 20.2, 20.5)
  const [relatedCategories, setRelatedCategories] = useState<RelatedDataItem[]>([]);
  const [relatedCategoriesCount, setRelatedCategoriesCount] = useState(0);
  const [isLoadingRelatedCategories, setIsLoadingRelatedCategories] = useState(false);

  // Fetch related categories for edit mode (Requirements: 20.2, 20.5)
  useEffect(() => {
    async function fetchRelatedCategories() {
      if (isNew || !initialData?.id) return;

      setIsLoadingRelatedCategories(true);
      try {
        const response = await fetch(`/api/admin/category-groups/${initialData.id}/related-categories`);
        if (response.ok) {
          const data = await response.json();
          setRelatedCategories(
            (data.categories || []).map((category: { id: string; name: string; slug: string }) => ({
              id: category.id,
              label: category.name,
              href: `/admin/categories/${category.id}/edit`,
              sublabel: `/${category.slug}`,
            }))
          );
          setRelatedCategoriesCount(data.totalCount || 0);
        }
      } catch (error) {
        console.error('Error fetching related categories:', error);
      } finally {
        setIsLoadingRelatedCategories(false);
      }
    }
    fetchRelatedCategories();
  }, [isNew, initialData?.id]);

  // Field change handler
  const handleChange = <K extends keyof CategoryGroupFormData>(
    field: K,
    value: CategoryGroupFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const validation = validateFormData(categoryGroupSchema, formData);
    if (!validation.success) {
      setErrors(validation.errors);
      addToast({
        variant: 'error',
        message: 'Please fix the validation errors before submitting.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isNew
        ? '/api/admin/category-groups'
        : `/api/admin/category-groups/${initialData?.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errors) {
          setErrors(errorData.errors);
        }
        throw new Error(errorData.error || 'Failed to save category group');
      }

      addToast({
        variant: 'success',
        message: isNew
          ? 'Category group created successfully'
          : 'Category group updated successfully',
      });

      router.push('/admin/category-groups');
      router.refresh();
    } catch (error) {
      console.error('Error saving category group:', error);
      addToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to save category group',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        {/* Name Field */}
        <TextField
          name="name"
          label="Name"
          value={formData.name}
          onChange={(value) => handleChange('name', value)}
          required
          error={errors.name}
          placeholder="Enter group name"
          maxLength={50}
          helpText="2-50 characters. Must be unique."
        />

        {/* Icon Field */}
        <IconPickerField
          name="icon_name"
          label="Icon"
          value={formData.icon_name ?? null}
          onChange={(value) => handleChange('icon_name', value ?? undefined)}
          icons={[]} // Uses default icons from component
          error={errors.icon_name}
          helpText="Select an icon to represent this group"
        />

        {/* Display Order Field */}
        <NumberField
          name="display_order"
          label="Display Order"
          value={formData.display_order ?? null}
          onChange={(value) => handleChange('display_order', value ?? undefined)}
          error={errors.display_order}
          min={0}
          helpText="Lower numbers appear first. Leave empty for auto-assignment."
        />

        {/* Audit Fields (read-only, only for edit) */}
        {!isNew && initialData && (
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Audit Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Created:</span>{' '}
                <span className="text-gray-900">
                  {initialData.created_at
                    ? new Date(initialData.created_at).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Updated:</span>{' '}
                <span className="text-gray-900">
                  {initialData.updated_at
                    ? new Date(initialData.updated_at).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Related Categories Section (Requirements: 20.2, 20.5, 20.6) */}
      {!isNew && initialData?.id && (
        <RelatedDataSection
          title="Categories in this Group"
          items={relatedCategories}
          totalCount={relatedCategoriesCount}
          viewAllHref={`/admin/categories?group_id=${initialData.id}`}
          isLoading={isLoadingRelatedCategories}
          emptyMessage="No categories assigned to this group"
          maxItems={10}
          defaultExpanded={true}
        />
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/category-groups">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isNew ? 'Create Group' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
