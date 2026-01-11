'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/admin/form-fields/TextField';
import { createLogger } from '@/lib/logger';

const log = createLogger('CategoryForm');
import { TextareaField } from '@/components/admin/form-fields/TextareaField';
import { NumberField } from '@/components/admin/form-fields/NumberField';
import { IconPickerField } from '@/components/admin/form-fields/IconPickerField';
import { JsonEditorField } from '@/components/admin/form-fields/JsonEditorField';
import { useToast } from '@/components/admin/Toast';
import { RelatedDataSection, type RelatedDataItem } from '@/components/admin/RelatedDataSection';
import { categorySchema, validateFormData, generateSlug } from '@/lib/utils/admin-validation';
import type { CategoryFormData } from '@/lib/types/admin-forms';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

interface CategoryFormProps {
  initialData?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    display_order: number | null;
    metadata: Record<string, unknown> | null;
    created_at?: string | null;
    updated_at?: string | null;
    tool_count?: number;
  };
  isNew: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function CategoryForm({ initialData, isNew }: CategoryFormProps) {
  const router = useRouter();
  const { addToast } = useToast();

  // Form state
  const [formData, setFormData] = useState<CategoryFormData>({
    name: initialData?.name ?? '',
    slug: initialData?.slug ?? '',
    description: initialData?.description ?? undefined,
    icon: initialData?.icon ?? undefined,
    display_order: initialData?.display_order ?? undefined,
    metadata: initialData?.metadata ?? undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(isNew);

  // Related tools state (Requirements: 20.1, 20.5)
  const [relatedTools, setRelatedTools] = useState<RelatedDataItem[]>([]);
  const [relatedToolsCount, setRelatedToolsCount] = useState(0);
  const [isLoadingRelatedTools, setIsLoadingRelatedTools] = useState(false);

  // Fetch related tools for edit mode (Requirements: 20.1, 20.5)
  useEffect(() => {
    async function fetchRelatedTools() {
      if (isNew || !initialData?.id) return;

      setIsLoadingRelatedTools(true);
      try {
        const response = await fetch(`/api/admin/categories/${initialData.id}/related-tools`);
        if (response.ok) {
          const data = await response.json();
          setRelatedTools(
            (data.tools || []).map((tool: { id: string; name: string; slug: string; status: string }) => ({
              id: tool.id,
              label: tool.name,
              href: `/admin/tools/${tool.id}/edit`,
              sublabel: `/${tool.slug} • ${tool.status}`,
            }))
          );
          setRelatedToolsCount(data.totalCount || 0);
        }
      } catch (error) {
        log.error('Error fetching related tools', error, { action: 'fetchRelatedTools' });
      } finally {
        setIsLoadingRelatedTools(false);
      }
    }
    fetchRelatedTools();
  }, [isNew, initialData?.id]);

  // Field change handler
  const handleChange = <K extends keyof CategoryFormData>(
    field: K,
    value: CategoryFormData[K]
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
    const validation = validateFormData(categorySchema, formData);
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
        ? '/api/admin/categories'
        : `/api/admin/categories/${initialData?.id}`;
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
        throw new Error(errorData.error || 'Failed to save category');
      }

      addToast({
        variant: 'success',
        message: isNew
          ? 'Category created successfully'
          : 'Category updated successfully',
      });

      router.push('/admin/categories');
      router.refresh();
    } catch (error) {
      log.error('Error saving category', error, { action: 'save' });
      addToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to save category',
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
          placeholder="Enter category name"
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
          placeholder="category-slug"
          helpText="URL-friendly identifier. Lowercase letters, numbers, and hyphens only."
        />

        {/* Description Field */}
        <TextareaField
          name="description"
          label="Description"
          value={formData.description ?? ''}
          onChange={(value) => handleChange('description', value || undefined)}
          error={errors.description}
          placeholder="Enter category description"
          maxLength={500}
          rows={3}
          helpText="Optional. Max 500 characters."
        />

        {/* Icon Field */}
        <IconPickerField
          name="icon"
          label="Icon"
          value={formData.icon ?? null}
          onChange={(value) => handleChange('icon', value ?? undefined)}
          icons={[]}
          error={errors.icon}
          helpText="Select an icon to represent this category"
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

        {/* Metadata Field */}
        <JsonEditorField
          name="metadata"
          label="Metadata"
          value={formData.metadata ?? null}
          onChange={(value) => handleChange('metadata', value ?? undefined)}
          error={errors.metadata}
          helpText="Optional JSON metadata for custom fields"
        />

        {/* Read-only fields (only for edit) */}
        {!isNew && initialData && (
          <div className="pt-4 border-t border-gray-200 space-y-4">
            {/* Tool Count (computed, read-only) */}
            {initialData.tool_count !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tool Count
                </label>
                <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  {initialData.tool_count} tool{initialData.tool_count !== 1 ? 's' : ''} in this category
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

      {/* Related Tools Section (Requirements: 20.1, 20.5, 20.6) */}
      {!isNew && initialData?.id && (
        <RelatedDataSection
          title="Tools in this Category"
          items={relatedTools}
          totalCount={relatedToolsCount}
          viewAllHref={`/admin/tools?category_id=${initialData.id}`}
          isLoading={isLoadingRelatedTools}
          emptyMessage="No tools assigned to this category"
          maxItems={10}
          defaultExpanded={true}
        />
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/categories">
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
              {isNew ? 'Create Category' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
