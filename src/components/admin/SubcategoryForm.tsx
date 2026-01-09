'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/admin/form-fields/TextField';
import { NumberField } from '@/components/admin/form-fields/NumberField';
import { SelectField } from '@/components/admin/form-fields/SelectField';
import { useToast } from '@/components/admin/Toast';
import { createLogger } from '@/lib/logger';

const log = createLogger('SubcategoryForm');
import { subcategorySchema, validateFormData, generateSlug } from '@/lib/utils/admin-validation';
import type { SubcategoryFormData } from '@/lib/types/admin-forms';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SubcategoryFormProps {
  initialData?: {
    id: string;
    name: string;
    slug: string;
    category_id: string;
    display_order: number | null;
    tool_count?: number;
    created_at?: string | null;
    updated_at?: string | null;
    category?: Category | null;
  };
  isNew: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * SubcategoryForm Component
 * 
 * Form for creating and editing subcategories.
 * Requirements: 6.5, 6.6
 * - Implement all fields including category_id select (required)
 * - Display read-only tool_count
 */
export function SubcategoryForm({ initialData, isNew }: SubcategoryFormProps) {
  const router = useRouter();
  const { addToast } = useToast();

  // Form state
  const [formData, setFormData] = useState<SubcategoryFormData>({
    name: initialData?.name ?? '',
    slug: initialData?.slug ?? '',
    category_id: initialData?.category_id ?? '',
    display_order: initialData?.display_order ?? undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(isNew);

  // Fetch categories for the select field
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/admin/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.data || []);
        }
      } catch (error) {
        log.error('Error fetching categories', error, { action: 'fetchCategories' });
        addToast({
          variant: 'error',
          message: 'Failed to load categories',
        });
      } finally {
        setIsLoadingCategories(false);
      }
    }
    fetchCategories();
  }, [addToast]);

  // Field change handler
  const handleChange = <K extends keyof SubcategoryFormData>(
    field: K,
    value: SubcategoryFormData[K]
  ) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      
      // Auto-generate slug from name if enabled
      if (field === 'name' && autoGenerateSlug && typeof value === 'string') {
        next.slug = generateSlug(value);
      }
      
      return next;
    });
    
    // Clear error when field is modified
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Handle slug field change - disable auto-generation if user manually edits
  const handleSlugChange = (value: string) => {
    setAutoGenerateSlug(false);
    handleChange('slug', value);
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const validation = validateFormData(subcategorySchema, formData);
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
        ? '/api/admin/subcategories'
        : `/api/admin/subcategories/${initialData?.id}`;
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
        throw new Error(errorData.error || 'Failed to save subcategory');
      }

      addToast({
        variant: 'success',
        message: isNew
          ? 'Subcategory created successfully'
          : 'Subcategory updated successfully',
      });

      router.push('/admin/subcategories');
      router.refresh();
    } catch (error) {
      log.error('Error saving subcategory', error, { action: 'save' });
      addToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to save subcategory',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Category options for select field
  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

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
          placeholder="Enter subcategory name"
          maxLength={100}
          helpText="2-100 characters"
        />

        {/* Slug Field */}
        <TextField
          name="slug"
          label="Slug"
          value={formData.slug}
          onChange={handleSlugChange}
          required
          error={errors.slug}
          placeholder="subcategory-slug"
          helpText="URL-friendly identifier. Lowercase letters, numbers, and hyphens only. Must be unique within the parent category."
        />

        {/* Category Field (Required) */}
        <SelectField
          name="category_id"
          label="Parent Category"
          value={formData.category_id}
          onChange={(value) => handleChange('category_id', value ?? '')}
          options={categoryOptions}
          required
          error={errors.category_id}
          disabled={isLoadingCategories}
          placeholder={isLoadingCategories ? 'Loading categories...' : 'Select a category'}
          helpText="Required. The parent category for this subcategory."
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

        {/* Read-only fields (only for edit) */}
        {!isNew && initialData && (
          <div className="pt-4 border-t border-gray-200 space-y-4">
            {/* Tool Count (computed, read-only) - Requirements: 6.6 */}
            {initialData.tool_count !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tool Count
                </label>
                <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  {initialData.tool_count} tool{initialData.tool_count !== 1 ? 's' : ''} in this subcategory
                </div>
              </div>
            )}

            {/* Parent Category Info */}
            {initialData.category && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Parent Category
                </label>
                <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  {initialData.category.name} ({initialData.category.slug})
                </div>
              </div>
            )}

            {/* Audit Information */}
            <div>
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
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/subcategories">
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
              {isNew ? 'Create Subcategory' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
