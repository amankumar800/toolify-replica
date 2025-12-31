'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/admin/Toast';
import { useUnsavedChanges } from '@/components/admin/UnsavedChangesProvider';
import {
  TextField,
  TextareaField,
  NumberField,
  SelectField,
  MultiSelectField,
  ToggleField,
  TagInputField,
  JsonEditorField,
  ImageUploadField,
  RichTextField,
  FormSection,
} from '@/components/admin/form-fields';
import { RelatedDataSection, type RelatedDataItem } from '@/components/admin/RelatedDataSection';
import { toolSchema, generateSlug } from '@/lib/utils/admin-validation';
import type { ToolFormData, ToolStatus, ToolPricing } from '@/lib/types/admin-forms';
import { ExternalLink, Eye, Save, ArrowLeft, AlertTriangle } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ToolFormProps {
  /** Initial form data for editing */
  initialData?: ToolFormData & {
    id?: string;
    created_at?: string;
    updated_at?: string;
    categories?: { id: string; name: string; slug: string }[];
  };
  /** Available categories for multi-select */
  categories?: { id: string; name: string }[];
  /** Whether this is a new tool or editing existing */
  isNew?: boolean;
  /** Duplicate detection results */
  duplicates?: {
    hasDuplicates: boolean;
    matches: Array<{
      id: string;
      name: string;
      matchType: 'name' | 'url';
      matchScore: number;
      href: string;
    }>;
  };
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_OPTIONS: { value: ToolStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
];

const PRICING_OPTIONS: { value: ToolPricing; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'freemium', label: 'Freemium' },
  { value: 'paid', label: 'Paid' },
  { value: 'contact', label: 'Contact for Pricing' },
];

const DEFAULT_FORM_DATA: ToolFormData = {
  name: '',
  slug: '',
  website_url: '',
  description: '',
  short_description: '',
  image_url: '',
  pricing: 'freemium',
  status: 'draft',
  is_featured: false,
  is_new: true,
  verified: false,
  tags: [],
  category_ids: [],
  monthly_visits: undefined,
  review_score: undefined,
  review_count: undefined,
  metadata: {},
  submitter_name: '',
  submitter_email: '',
  rejection_reason: '',
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * ToolForm Component
 *
 * Comprehensive form for creating and editing tools.
 * Includes all fields from requirements 3.8, category multi-select,
 * read-only audit fields, and preview button.
 *
 * Requirements: 3.8, 3.9, 18.1, 18.3, 21.1-21.5
 */
export function ToolForm({
  initialData,
  categories = [],
  isNew = true,
  duplicates: initialDuplicates,
}: ToolFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const { setHasUnsavedChanges } = useUnsavedChanges();

  // Form state
  const [formData, setFormData] = useState<ToolFormData>(() => ({
    ...DEFAULT_FORM_DATA,
    ...initialData,
    category_ids: initialData?.categories?.map((c) => c.id) ?? [],
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicates, setDuplicates] = useState(initialDuplicates);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const duplicateCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify({
      ...DEFAULT_FORM_DATA,
      ...initialData,
      category_ids: initialData?.categories?.map((c) => c.id) ?? [],
    });
    setHasUnsavedChanges(hasChanges);
  }, [formData, initialData, setHasUnsavedChanges]);

  // Check for duplicates when name or URL changes (debounced)
  // Requirements: 21.1, 21.2
  const checkDuplicates = useCallback(async (name: string, websiteUrl: string) => {
    if (!isNew) return; // Only check for new tools
    if (!name && !websiteUrl) return;

    setIsCheckingDuplicates(true);
    try {
      const response = await fetch('/api/admin/tools/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          website_url: websiteUrl,
          excludeId: initialData?.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setDuplicates(result);
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
    } finally {
      setIsCheckingDuplicates(false);
    }
  }, [isNew, initialData?.id]);

  // Debounced duplicate check
  useEffect(() => {
    if (!isNew) return;

    if (duplicateCheckTimeoutRef.current) {
      clearTimeout(duplicateCheckTimeoutRef.current);
    }

    duplicateCheckTimeoutRef.current = setTimeout(() => {
      checkDuplicates(formData.name, formData.website_url);
    }, 500);

    return () => {
      if (duplicateCheckTimeoutRef.current) {
        clearTimeout(duplicateCheckTimeoutRef.current);
      }
    };
  }, [formData.name, formData.website_url, isNew, checkDuplicates]);

  // Auto-generate slug from name
  const handleNameChange = useCallback((value: string) => {
    setFormData((prev) => ({
      ...prev,
      name: value,
      // Only auto-generate slug for new tools or if slug is empty
      slug: isNew || !prev.slug ? generateSlug(value) : prev.slug,
    }));
  }, [isNew]);

  // Update form field
  const updateField = useCallback(<K extends keyof ToolFormData>(
    field: K,
    value: ToolFormData[K]
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
    const result = toolSchema.safeParse(formData);
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

    // Check for duplicates on new tools
    if (isNew && duplicates?.hasDuplicates && !showDuplicateWarning) {
      setShowDuplicateWarning(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isNew
        ? '/api/admin/tools'
        : `/api/admin/tools/${initialData?.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save tool');
      }

      setHasUnsavedChanges(false);

      addToast({
        variant: 'success',
        message: isNew ? 'Tool created successfully!' : 'Tool updated successfully!',
      });

      router.push('/admin/tools');
      router.refresh();
    } catch (error) {
      console.error('Error saving tool:', error);
      addToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to save tool',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle preview
  // Requirements: 18.1, 18.3 - Preview button disabled for new records
  const handlePreview = () => {
    if (formData.slug) {
      window.open(`/tool/${formData.slug}?preview=true`, '_blank');
    }
  };

  // Category options for multi-select
  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Duplicate Warning */}
      {showDuplicateWarning && duplicates?.hasDuplicates && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-800">Potential Duplicates Found</h4>
              <p className="text-sm text-yellow-700 mt-1">
                We found tools that may be duplicates. Please review before continuing:
              </p>
              <ul className="mt-2 space-y-1">
                {duplicates.matches.map((match) => (
                  <li key={match.id} className="text-sm">
                    <Link
                      href={match.href}
                      className="text-yellow-800 hover:underline font-medium"
                      target="_blank"
                    >
                      {match.name}
                    </Link>
                    <span className="text-yellow-600 ml-2">
                      ({match.matchType === 'name' ? `${match.matchScore}% name match` : 'Same URL'})
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 mt-3">
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                >
                  Create Anyway
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDuplicateWarning(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/admin/tools')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tools
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
            {isSubmitting ? 'Saving...' : isNew ? 'Create Tool' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <FormSection title="Basic Information" description="Core tool details">
        <TextField
          name="name"
          label="Name"
          value={formData.name}
          onChange={handleNameChange}
          required
          maxLength={100}
          error={errors.name}
          placeholder="e.g., ChatGPT"
        />

        <TextField
          name="slug"
          label="Slug"
          value={formData.slug}
          onChange={(v) => updateField('slug', v)}
          required
          error={errors.slug}
          placeholder="e.g., chatgpt"
          helpText="URL-friendly identifier (auto-generated from name)"
        />

        <TextField
          name="website_url"
          label="Website URL"
          type="url"
          value={formData.website_url}
          onChange={(v) => updateField('website_url', v)}
          required
          error={errors.website_url}
          placeholder="https://example.com"
        />

        <TextareaField
          name="short_description"
          label="Short Description"
          value={formData.short_description ?? ''}
          onChange={(v) => updateField('short_description', v)}
          maxLength={300}
          rows={2}
          error={errors.short_description}
          placeholder="Brief summary of the tool (max 300 characters)"
        />

        <RichTextField
          name="description"
          label="Description"
          value={formData.description ?? ''}
          onChange={(v) => updateField('description', v)}
          maxLength={5000}
          error={errors.description}
          helpText="Detailed description with markdown support"
        />
      </FormSection>

      {/* Media */}
      <FormSection title="Media" description="Tool images and visual assets">
        <ImageUploadField
          name="image_url"
          label="Tool Image"
          value={formData.image_url ?? null}
          onChange={(v) => updateField('image_url', v ?? '')}
          error={errors.image_url}
          helpText="Recommended size: 600x400px. Supports JPG, PNG, WebP (max 5MB)"
        />
      </FormSection>

      {/* Classification */}
      <FormSection title="Classification" description="Categorization and pricing">
        <SelectField
          name="pricing"
          label="Pricing"
          value={formData.pricing ?? null}
          onChange={(v) => updateField('pricing', v as ToolPricing)}
          options={PRICING_OPTIONS}
          error={errors.pricing}
        />

        <SelectField
          name="status"
          label="Status"
          value={formData.status ?? null}
          onChange={(v) => updateField('status', v as ToolStatus)}
          options={STATUS_OPTIONS}
          error={errors.status}
        />

        <MultiSelectField
          name="category_ids"
          label="Categories"
          value={formData.category_ids ?? []}
          onChange={(v) => updateField('category_ids', v)}
          options={categoryOptions}
          error={errors.category_ids}
          helpText="Select one or more categories"
        />

        <TagInputField
          name="tags"
          label="Tags"
          value={formData.tags ?? []}
          onChange={(v) => updateField('tags', v)}
          error={errors.tags}
          helpText="Press Enter to add a tag"
        />
      </FormSection>

      {/* Flags */}
      <FormSection title="Flags" description="Feature flags and verification status">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ToggleField
            name="is_featured"
            label="Featured"
            value={formData.is_featured ?? false}
            onChange={(v) => updateField('is_featured', v)}
            helpText="Show in featured section"
          />

          <ToggleField
            name="is_new"
            label="New"
            value={formData.is_new ?? false}
            onChange={(v) => updateField('is_new', v)}
            helpText="Display 'New' badge"
          />

          <ToggleField
            name="verified"
            label="Verified"
            value={formData.verified ?? false}
            onChange={(v) => updateField('verified', v)}
            helpText="Verified by admin"
          />
        </div>
      </FormSection>

      {/* Metrics */}
      <FormSection title="Metrics" description="Usage and review statistics">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumberField
            name="monthly_visits"
            label="Monthly Visits"
            value={formData.monthly_visits ?? null}
            onChange={(v) => updateField('monthly_visits', v ?? undefined)}
            min={0}
            error={errors.monthly_visits}
          />

          <NumberField
            name="review_score"
            label="Review Score"
            value={formData.review_score ?? null}
            onChange={(v) => updateField('review_score', v ?? undefined)}
            min={0}
            max={5}
            step={0.1}
            error={errors.review_score}
            helpText="0-5 scale"
          />

          <NumberField
            name="review_count"
            label="Review Count"
            value={formData.review_count ?? null}
            onChange={(v) => updateField('review_count', v ?? undefined)}
            min={0}
            error={errors.review_count}
          />
        </div>
      </FormSection>

      {/* Submission Info */}
      <FormSection title="Submission Info" description="Information about who submitted this tool">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            name="submitter_name"
            label="Submitter Name"
            value={formData.submitter_name ?? ''}
            onChange={(v) => updateField('submitter_name', v)}
            error={errors.submitter_name}
          />

          <TextField
            name="submitter_email"
            label="Submitter Email"
            type="email"
            value={formData.submitter_email ?? ''}
            onChange={(v) => updateField('submitter_email', v)}
            error={errors.submitter_email}
          />
        </div>

        {formData.status === 'rejected' && (
          <TextareaField
            name="rejection_reason"
            label="Rejection Reason"
            value={formData.rejection_reason ?? ''}
            onChange={(v) => updateField('rejection_reason', v)}
            rows={3}
            error={errors.rejection_reason}
            helpText="Explain why this tool was rejected"
          />
        )}
      </FormSection>

      {/* Advanced */}
      <FormSection title="Advanced" description="Additional metadata and configuration">
        <JsonEditorField
          name="metadata"
          label="Metadata"
          value={formData.metadata ?? null}
          onChange={(v) => updateField('metadata', v ?? {})}
          error={errors.metadata}
          helpText="Additional JSON metadata"
        />
      </FormSection>

      {/* Audit Fields (Read-only) */}
      {!isNew && initialData?.created_at && (
        <FormSection title="Audit Information" description="System-generated timestamps">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created At
              </label>
              <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                {new Date(initialData.created_at).toLocaleString()}
              </p>
            </div>
            {initialData.updated_at && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Updated At
                </label>
                <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  {new Date(initialData.updated_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </FormSection>
      )}

      {/* Assigned Categories Section (Requirements: 20.3, 20.5, 20.6) */}
      {!isNew && initialData?.categories && initialData.categories.length > 0 && (
        <RelatedDataSection
          title="Assigned Categories"
          items={initialData.categories.map((cat) => ({
            id: cat.id,
            label: cat.name,
            href: `/admin/categories/${cat.id}/edit`,
            sublabel: `/${cat.slug}`,
          }))}
          totalCount={initialData.categories.length}
          viewAllHref="/admin/categories"
          emptyMessage="No categories assigned"
          maxItems={10}
          defaultExpanded={true}
        />
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/tools')}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Saving...' : isNew ? 'Create Tool' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
