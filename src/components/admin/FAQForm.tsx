'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/admin/Toast';
import { useUnsavedChanges } from '@/components/admin/UnsavedChangesProvider';
import {
  TextField,
  SelectField,
  NumberField,
  RichTextField,
  FormSection,
  ReadOnlyField,
} from '@/components/admin/form-fields';
import { faqSchema } from '@/lib/utils/admin-validation';
import type { FAQFormData, FAQCategory } from '@/lib/types/admin-forms';
import { Save, ArrowLeft } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface FAQFormProps {
  /** Initial form data for editing */
  initialData?: FAQFormData & {
    id?: string;
    created_at?: string;
    updated_at?: string;
  };
  /** Whether this is a new FAQ or editing existing */
  isNew?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_OPTIONS: { value: FAQCategory; label: string }[] = [
  { value: 'General', label: 'General' },
  { value: 'Tools', label: 'Tools' },
  { value: 'Account', label: 'Account' },
  { value: 'Technical', label: 'Technical' },
];

const DEFAULT_FORM_DATA: FAQFormData = {
  question: '',
  answer: '',
  category: undefined,
  display_order: undefined,
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * FAQForm Component
 *
 * Comprehensive form for creating and editing FAQs.
 * Includes all fields from requirements 9.5 with rich-text answer.
 *
 * Requirements: 9.5
 */
export function FAQForm({
  initialData,
  isNew = true,
}: FAQFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const { setHasUnsavedChanges } = useUnsavedChanges();

  // Form state
  const [formData, setFormData] = useState<FAQFormData>(() => ({
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

  // Update form field
  const updateField = useCallback(<K extends keyof FAQFormData>(
    field: K,
    value: FAQFormData[K]
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
    const result = faqSchema.safeParse(formData);
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
        ? '/api/admin/faqs'
        : `/api/admin/faqs/${initialData?.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save FAQ');
      }

      setHasUnsavedChanges(false);

      addToast({
        variant: 'success',
        message: isNew ? 'FAQ created successfully!' : 'FAQ updated successfully!',
      });

      router.push('/admin/faqs');
      router.refresh();
    } catch (error) {
      console.error('Error saving FAQ:', error);
      addToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to save FAQ',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/admin/faqs')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to FAQs
        </Button>
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Saving...' : isNew ? 'Create FAQ' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Question */}
      <FormSection title="Question" description="The FAQ question">
        <TextField
          name="question"
          label="Question"
          value={formData.question}
          onChange={(v) => updateField('question', v)}
          required
          maxLength={500}
          error={errors.question}
          placeholder="e.g., How do I submit a new AI tool?"
          helpText="The question users might ask (10-500 characters)"
        />
      </FormSection>

      {/* Answer */}
      {/* Requirements: 9.5 - Rich-text answer field */}
      <FormSection title="Answer" description="The detailed answer to the question">
        <RichTextField
          name="answer"
          label="Answer"
          value={formData.answer}
          onChange={(v) => updateField('answer', v)}
          required
          maxLength={5000}
          error={errors.answer}
          helpText="Provide a comprehensive answer (max 5000 characters)"
        />
      </FormSection>

      {/* Classification */}
      <FormSection title="Classification" description="Category and ordering">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            name="category"
            label="Category"
            value={formData.category ?? null}
            onChange={(v) => updateField('category', (v ?? undefined) as FAQCategory | undefined)}
            options={CATEGORY_OPTIONS}
            error={errors.category}
            placeholder="Select a category"
            helpText="Organize FAQs by topic"
          />

          <NumberField
            name="display_order"
            label="Display Order"
            value={formData.display_order ?? null}
            onChange={(v) => updateField('display_order', v ?? undefined)}
            min={0}
            error={errors.display_order}
            helpText="Lower numbers appear first (auto-assigned if empty)"
          />
        </div>
      </FormSection>

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
          onClick={() => router.push('/admin/faqs')}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Saving...' : isNew ? 'Create FAQ' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
