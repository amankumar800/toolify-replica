'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/admin/Toast';
import { useUnsavedChanges } from '@/components/admin/UnsavedChangesProvider';
import { createLogger } from '@/lib/logger';

const log = createLogger('PromptForm');
import {
  TextField,
  TextareaField,
  SelectField,
  TagInputField,
  ImageUploadField,
  FormSection,
  ReadOnlyField,
} from '@/components/admin/form-fields';
import { promptSchema, generateSlug } from '@/lib/utils/admin-validation';
import type { PromptFormData, PromptType } from '@/lib/types/admin-forms';
import { Save, ArrowLeft } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface PromptFormProps {
  /** Initial form data for editing */
  initialData?: PromptFormData & {
    id?: string;
    created_at?: string;
    updated_at?: string;
    view_count?: number;
    copy_count?: number;
  };
  /** Whether this is a new prompt or editing existing */
  isNew?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const TYPE_OPTIONS: { value: PromptType; label: string }[] = [
  { value: 'prompt', label: 'Prompt' },
  { value: 'sref', label: 'SREF' },
];

const DEFAULT_FORM_DATA: PromptFormData = {
  title: '',
  slug: '',
  type: 'prompt',
  prompt_text: '',
  sref_code: '',
  image_url: '',
  tags: [],
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * PromptForm Component
 *
 * Comprehensive form for creating and editing Midjourney prompts.
 * Includes all fields from requirements 8.4, conditional sref_code requirement,
 * and read-only analytics.
 *
 * Requirements: 8.4, 8.5, 8.6
 */
export function PromptForm({
  initialData,
  isNew = true,
}: PromptFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const { setHasUnsavedChanges } = useUnsavedChanges();

  // Form state
  const [formData, setFormData] = useState<PromptFormData>(() => ({
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
  const updateField = useCallback(<K extends keyof PromptFormData>(
    field: K,
    value: PromptFormData[K]
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
    const result = promptSchema.safeParse(formData);
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
        ? '/api/admin/prompts'
        : `/api/admin/prompts/${initialData?.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save prompt');
      }

      setHasUnsavedChanges(false);

      addToast({
        variant: 'success',
        message: isNew ? 'Prompt created successfully!' : 'Prompt updated successfully!',
      });

      router.push('/admin/prompts');
      router.refresh();
    } catch (error) {
      log.error('Error saving prompt', error, { action: 'save' });
      addToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to save prompt',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if sref_code is required
  // Requirements: 8.6 - sref_code is required when type is 'sref'
  const isSrefCodeRequired = formData.type === 'sref';

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/admin/prompts')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Prompts
        </Button>
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Saving...' : isNew ? 'Create Prompt' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <FormSection title="Basic Information" description="Core prompt details">
        <TextField
          name="title"
          label="Title"
          value={formData.title}
          onChange={handleTitleChange}
          required
          maxLength={200}
          error={errors.title}
          placeholder="e.g., Cyberpunk City at Night"
        />

        <TextField
          name="slug"
          label="Slug"
          value={formData.slug}
          onChange={(v) => updateField('slug', v)}
          required
          error={errors.slug}
          placeholder="e.g., cyberpunk-city-at-night"
          helpText="URL-friendly identifier (auto-generated from title)"
        />

        <SelectField
          name="type"
          label="Type"
          value={formData.type}
          onChange={(v) => updateField('type', (v ?? 'prompt') as PromptType)}
          options={TYPE_OPTIONS}
          required
          error={errors.type}
          helpText="Select 'SREF' for style reference codes, 'Prompt' for text prompts"
        />
      </FormSection>

      {/* Prompt Content */}
      <FormSection title="Prompt Content" description="The actual prompt or SREF code">
        <TextareaField
          name="prompt_text"
          label="Prompt Text"
          value={formData.prompt_text ?? ''}
          onChange={(v) => updateField('prompt_text', v)}
          maxLength={2000}
          rows={5}
          error={errors.prompt_text}
          placeholder="Enter the Midjourney prompt text..."
          helpText="The full prompt text (max 2000 characters)"
        />

        {/* Conditional SREF Code field */}
        {/* Requirements: 8.6 - sref_code is required when type is 'sref' */}
        <TextField
          name="sref_code"
          label="SREF Code"
          value={formData.sref_code ?? ''}
          onChange={(v) => updateField('sref_code', v)}
          required={isSrefCodeRequired}
          error={errors.sref_code}
          placeholder="e.g., --sref 123456789"
          helpText={isSrefCodeRequired 
            ? "Required for SREF type prompts" 
            : "Optional for regular prompts"
          }
        />
      </FormSection>

      {/* Media */}
      <FormSection title="Media" description="Visual representation of the prompt">
        <ImageUploadField
          name="image_url"
          label="Preview Image"
          value={formData.image_url ?? null}
          onChange={(v) => updateField('image_url', v ?? '')}
          error={errors.image_url}
          helpText="Example output image (max 5MB)"
        />
      </FormSection>

      {/* Classification */}
      <FormSection title="Classification" description="Tags for organization">
        <TagInputField
          name="tags"
          label="Tags"
          value={formData.tags ?? []}
          onChange={(v) => updateField('tags', v)}
          error={errors.tags}
          helpText="Press Enter to add a tag"
        />
      </FormSection>

      {/* Analytics (Read-only) */}
      {/* Requirements: 8.5 - Display read-only analytics: view_count, copy_count */}
      {!isNew && initialData && (
        <FormSection title="Analytics" description="Prompt performance metrics (read-only)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadOnlyField
              label="View Count"
              value={String(initialData.view_count ?? 0)}
            />
            <ReadOnlyField
              label="Copy Count"
              value={String(initialData.copy_count ?? 0)}
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
          onClick={() => router.push('/admin/prompts')}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Saving...' : isNew ? 'Create Prompt' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
