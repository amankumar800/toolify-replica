'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/admin/Toast';
import { useUnsavedChanges } from '@/components/admin/UnsavedChangesProvider';
import {
  TextField,
  TextareaField,
  NumberField,
  SelectField,
  ToggleField,
  TagInputField,
  ImageUploadField,
  RichTextField,
  FormSection,
  ReadOnlyField,
} from '@/components/admin/form-fields';
import { aiNewsSchema, generateSlug } from '@/lib/utils/admin-validation';
import type { AINewsFormData, NewsCategory } from '@/lib/types/admin-forms';
import { Eye, Save, ArrowLeft } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface NewsFormProps {
  /** Initial form data for editing */
  initialData?: AINewsFormData & {
    id?: string;
    created_at?: string;
    updated_at?: string;
    view_count?: number;
    like_count?: number;
  };
  /** Whether this is a new news item or editing existing */
  isNew?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_OPTIONS: { value: NewsCategory; label: string }[] = [
  { value: 'AI Research', label: 'AI Research' },
  { value: 'Industry News', label: 'Industry News' },
  { value: 'Product Launch', label: 'Product Launch' },
  { value: 'Tutorial', label: 'Tutorial' },
  { value: 'Opinion', label: 'Opinion' },
];

const DEFAULT_FORM_DATA: AINewsFormData = {
  title: '',
  slug: '',
  content: '',
  summary: '',
  author_name: '',
  author_avatar: '',
  source_name: '',
  source_url: '',
  category: undefined,
  tags: [],
  is_published: false,
  published_at: undefined,
  priority_score: 0,
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * NewsForm Component
 *
 * Comprehensive form for creating and editing AI news articles.
 * Includes all fields from requirements 7.6, rich-text content,
 * read-only analytics, and preview button.
 *
 * Requirements: 7.6, 7.7, 7.8, 18.2
 */
export function NewsForm({
  initialData,
  isNew = true,
}: NewsFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const { setHasUnsavedChanges } = useUnsavedChanges();

  // Form state
  const [formData, setFormData] = useState<AINewsFormData>(() => ({
    ...DEFAULT_FORM_DATA,
    ...initialData,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify({
      ...DEFAULT_FORM_DATA,
      ...initialData,
    });
    setHasUnsavedChanges(hasChanges);
  }, [formData, initialData, setHasUnsavedChanges]);

  // Auto-generate slug from title
  const handleTitleChange = useCallback((value: string) => {
    setFormData((prev) => ({
      ...prev,
      title: value,
      // Only auto-generate slug for new items or if slug is empty
      slug: isNew || !prev.slug ? generateSlug(value) : prev.slug,
    }));
  }, [isNew]);

  // Update form field
  const updateField = useCallback(<K extends keyof AINewsFormData>(
    field: K,
    value: AINewsFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const result = aiNewsSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!newErrors[path]) {
          newErrors[path] = issue.message;
        }
      }
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  }, [formData]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      addToast({
        variant: 'error',
        message: 'Please fix the validation errors before submitting.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isNew
        ? '/api/admin/news'
        : `/api/admin/news/${initialData?.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save news');
      }

      setHasUnsavedChanges(false);

      addToast({
        variant: 'success',
        message: isNew ? 'News article created successfully!' : 'News article updated successfully!',
      });

      router.push('/admin/news');
      router.refresh();
    } catch (error) {
      console.error('Error saving news:', error);
      addToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to save news',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle preview
  // Requirements: 18.2 - Preview button
  const handlePreview = () => {
    if (formData.slug) {
      window.open(`/ai-news/${formData.slug}?preview=true`, '_blank');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/admin/news')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to News
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handlePreview}
            disabled={isNew || !formData.slug}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Saving...' : isNew ? 'Create Article' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <FormSection title="Basic Information" description="Core article details">
        <TextField
          name="title"
          label="Title"
          value={formData.title}
          onChange={handleTitleChange}
          required
          maxLength={200}
          error={errors.title}
          placeholder="e.g., OpenAI Announces GPT-5"
        />

        <TextField
          name="slug"
          label="Slug"
          value={formData.slug}
          onChange={(v) => updateField('slug', v)}
          required
          error={errors.slug}
          placeholder="e.g., openai-announces-gpt-5"
          helpText="URL-friendly identifier (auto-generated from title)"
        />

        <TextareaField
          name="summary"
          label="Summary"
          value={formData.summary ?? ''}
          onChange={(v) => updateField('summary', v)}
          maxLength={500}
          rows={3}
          error={errors.summary}
          placeholder="Brief summary of the article (max 500 characters)"
        />

        <RichTextField
          name="content"
          label="Content"
          value={formData.content ?? ''}
          onChange={(v) => updateField('content', v)}
          maxLength={50000}
          error={errors.content}
          helpText="Full article content with markdown support"
        />
      </FormSection>

      {/* Classification */}
      <FormSection title="Classification" description="Category and tags">
        <SelectField
          name="category"
          label="Category"
          value={formData.category ?? null}
          onChange={(v) => updateField('category', v as NewsCategory | undefined)}
          options={CATEGORY_OPTIONS}
          error={errors.category}
          placeholder="Select a category"
        />

        <TagInputField
          name="tags"
          label="Tags"
          value={formData.tags ?? []}
          onChange={(v) => updateField('tags', v)}
          error={errors.tags}
          helpText="Press Enter to add a tag"
        />

        <NumberField
          name="priority_score"
          label="Priority Score"
          value={formData.priority_score ?? null}
          onChange={(v) => updateField('priority_score', v ?? undefined)}
          min={0}
          max={100}
          error={errors.priority_score}
          helpText="0-100, higher values appear first"
        />
      </FormSection>

      {/* Author Information */}
      <FormSection title="Author Information" description="Article author details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            name="author_name"
            label="Author Name"
            value={formData.author_name ?? ''}
            onChange={(v) => updateField('author_name', v)}
            maxLength={100}
            error={errors.author_name}
            placeholder="e.g., John Doe"
          />

          <ImageUploadField
            name="author_avatar"
            label="Author Avatar"
            value={formData.author_avatar ?? null}
            onChange={(v) => updateField('author_avatar', v ?? '')}
            error={errors.author_avatar}
            helpText="Author profile image (max 2MB)"
          />
        </div>
      </FormSection>

      {/* Source Information */}
      <FormSection title="Source Information" description="Original source details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            name="source_name"
            label="Source Name"
            value={formData.source_name ?? ''}
            onChange={(v) => updateField('source_name', v)}
            maxLength={100}
            error={errors.source_name}
            placeholder="e.g., TechCrunch"
          />

          <TextField
            name="source_url"
            label="Source URL"
            type="url"
            value={formData.source_url ?? ''}
            onChange={(v) => updateField('source_url', v)}
            error={errors.source_url}
            placeholder="https://example.com/article"
          />
        </div>
      </FormSection>

      {/* Publishing */}
      <FormSection title="Publishing" description="Publication settings">
        <ToggleField
          name="is_published"
          label="Published"
          value={formData.is_published ?? false}
          onChange={(v) => updateField('is_published', v)}
          helpText="When enabled, the article will be visible to users"
        />

        {formData.is_published && formData.published_at && (
          <ReadOnlyField
            label="Published At"
            value={new Date(formData.published_at).toLocaleString()}
          />
        )}
      </FormSection>

      {/* Analytics (Read-only) */}
      {!isNew && initialData && (
        <FormSection title="Analytics" description="Article performance metrics (read-only)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadOnlyField
              label="View Count"
              value={String(initialData.view_count ?? 0)}
            />
            <ReadOnlyField
              label="Like Count"
              value={String(initialData.like_count ?? 0)}
            />
          </div>
        </FormSection>
      )}

      {/* Audit Fields (Read-only) */}
      {!isNew && initialData?.created_at && (
        <FormSection title="Audit Information" description="System-generated timestamps">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadOnlyField
              label="Created At"
              value={new Date(initialData.created_at).toLocaleString()}
            />
            {initialData.updated_at && (
              <ReadOnlyField
                label="Updated At"
                value={new Date(initialData.updated_at).toLocaleString()}
              />
            )}
          </div>
        </FormSection>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/news')}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Saving...' : isNew ? 'Create Article' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
