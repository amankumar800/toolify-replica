'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/admin/Toast';
import { useUnsavedChanges } from '@/components/admin/UnsavedChangesProvider';
import { createLogger } from '@/lib/logger';

const log = createLogger('FeaturedToolForm');
import {
  TextField,
  NumberField,
  SelectField,
  ToggleField,
  DateField,
  SearchableSelectField,
  FormSection,
  ReadOnlyField,
} from '@/components/admin/form-fields';
import { RelatedDataSection, type RelatedDataItem } from '@/components/admin/RelatedDataSection';
import { featuredToolSchema } from '@/lib/utils/admin-validation';
import type { FeaturedToolFormData, FeaturedPlacementType } from '@/lib/types/admin-forms';
import { Save, ArrowLeft } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface FeaturedToolFormProps {
  /** Initial form data for editing */
  initialData?: FeaturedToolFormData & {
    id?: string;
    tool_name?: string;
    created_at?: string;
    updated_at?: string;
    impression_count?: number;
    click_count?: number;
  };
  /** Whether this is a new featured tool or editing existing */
  isNew?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const PLACEMENT_OPTIONS: { value: FeaturedPlacementType; label: string }[] = [
  { value: 'homepage', label: 'Homepage' },
  { value: 'category', label: 'Category' },
  { value: 'search', label: 'Search' },
];

const DEFAULT_FORM_DATA: FeaturedToolFormData = {
  tool_id: '',
  placement_type: undefined,
  is_sponsored: false,
  sponsor_name: '',
  campaign_id: '',
  start_date: undefined,
  end_date: undefined,
  display_order: undefined,
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * FeaturedToolForm Component
 *
 * Comprehensive form for creating and editing featured tools.
 * Includes searchable tool select, conditional sponsor_name requirement,
 * and read-only analytics.
 *
 * Requirements: 10.5, 10.6, 10.7
 */
export function FeaturedToolForm({
  initialData,
  isNew = true,
}: FeaturedToolFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const { setHasUnsavedChanges } = useUnsavedChanges();

  // Form state
  const [formData, setFormData] = useState<FeaturedToolFormData>(() => ({
    ...DEFAULT_FORM_DATA,
    ...initialData,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tool details state (Requirements: 20.4, 20.5)
  const [toolDetails, setToolDetails] = useState<{
    id: string;
    name: string;
    slug: string;
    status: string;
    website_url: string;
  } | null>(null);
  const [isLoadingToolDetails, setIsLoadingToolDetails] = useState(false);

  // Track unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify({
      ...DEFAULT_FORM_DATA,
      ...initialData,
    });
    setHasUnsavedChanges(hasChanges);
  }, [formData, initialData, setHasUnsavedChanges]);

  // Fetch tool details when tool_id is set (Requirements: 20.4, 20.5)
  useEffect(() => {
    async function fetchToolDetails() {
      if (!formData.tool_id) {
        setToolDetails(null);
        return;
      }

      setIsLoadingToolDetails(true);
      try {
        const response = await fetch(`/api/admin/featured/search-tools?id=${formData.tool_id}`);
        if (response.ok) {
          const tools = await response.json();
          if (tools.length > 0) {
            setToolDetails(tools[0]);
          }
        }
      } catch (error) {
        log.error('Error fetching tool details', error, { action: 'fetchToolDetails' });
      } finally {
        setIsLoadingToolDetails(false);
      }
    }
    fetchToolDetails();
  }, [formData.tool_id]);

  // Update form field
  const updateField = useCallback(<K extends keyof FeaturedToolFormData>(
    field: K,
    value: FeaturedToolFormData[K]
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

  // Handle is_sponsored change - clear sponsor_name error if unchecked
  const handleSponsoredChange = useCallback((value: boolean) => {
    updateField('is_sponsored', value);
    if (!value) {
      // Clear sponsor_name error when unchecking sponsored
      setErrors((prev) => {
        const next = { ...prev };
        delete next.sponsor_name;
        return next;
      });
    }
  }, [updateField]);

  // Search tools for select
  const searchTools = useCallback(async (query: string) => {
    try {
      const params = new URLSearchParams();
      if (query) {
        params.set('q', query);
      }
      // If we have a tool_id but no query, fetch that specific tool
      if (!query && formData.tool_id) {
        params.set('id', formData.tool_id);
      }

      const response = await fetch(`/api/admin/featured/search-tools?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to search tools');
      }

      return await response.json();
    } catch (error) {
      log.error('Error searching tools', error, { action: 'searchTools' });
      return [];
    }
  }, [formData.tool_id]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    // Convert dates for validation
    const dataToValidate = {
      ...formData,
      start_date: formData.start_date ? new Date(formData.start_date) : undefined,
      end_date: formData.end_date ? new Date(formData.end_date) : undefined,
    };

    const result = featuredToolSchema.safeParse(dataToValidate);
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
        ? '/api/admin/featured'
        : `/api/admin/featured/${initialData?.id}`;
      const method = isNew ? 'POST' : 'PUT';

      // Prepare data for submission
      const submitData = {
        ...formData,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : undefined,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : undefined,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save featured tool');
      }

      setHasUnsavedChanges(false);

      addToast({
        variant: 'success',
        message: isNew ? 'Featured tool created successfully!' : 'Featured tool updated successfully!',
      });

      router.push('/admin/featured');
      router.refresh();
    } catch (error) {
      log.error('Error saving featured tool', error, { action: 'save' });
      addToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to save featured tool',
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
          onClick={() => router.push('/admin/featured')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Featured Tools
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Saving...' : isNew ? 'Create Featured Tool' : 'Save Changes'}
        </Button>
      </div>

      {/* Tool Selection */}
      <FormSection title="Tool Selection" description="Select the tool to feature">
        <SearchableSelectField
          name="tool_id"
          label="Tool"
          value={formData.tool_id || null}
          onChange={(v) => updateField('tool_id', v ?? '')}
          onSearch={searchTools}
          required
          error={errors.tool_id}
          placeholder="Search for a tool..."
          helpText="Search by tool name or slug"
        />
      </FormSection>

      {/* Placement Settings */}
      <FormSection title="Placement Settings" description="Configure where and how the tool is featured">
        <SelectField
          name="placement_type"
          label="Placement Type"
          value={formData.placement_type ?? null}
          onChange={(v) => updateField('placement_type', v as FeaturedPlacementType | undefined)}
          options={PLACEMENT_OPTIONS}
          error={errors.placement_type}
          placeholder="Select placement"
          helpText="Where the featured tool will be displayed"
        />

        <NumberField
          name="display_order"
          label="Display Order"
          value={formData.display_order ?? null}
          onChange={(v) => updateField('display_order', v ?? undefined)}
          min={0}
          error={errors.display_order}
          helpText="Lower numbers appear first"
        />
      </FormSection>

      {/* Sponsorship */}
      <FormSection title="Sponsorship" description="Configure sponsorship details">
        <ToggleField
          name="is_sponsored"
          label="Sponsored"
          value={formData.is_sponsored ?? false}
          onChange={handleSponsoredChange}
          helpText="Enable if this is a paid sponsorship"
        />

        {formData.is_sponsored && (
          <>
            <TextField
              name="sponsor_name"
              label="Sponsor Name"
              value={formData.sponsor_name ?? ''}
              onChange={(v) => updateField('sponsor_name', v)}
              required={formData.is_sponsored}
              error={errors.sponsor_name}
              placeholder="e.g., Acme Corp"
              helpText="Required when sponsored is enabled"
            />

            <TextField
              name="campaign_id"
              label="Campaign ID"
              value={formData.campaign_id ?? ''}
              onChange={(v) => updateField('campaign_id', v)}
              error={errors.campaign_id}
              placeholder="e.g., CAMP-2024-001"
              helpText="Optional tracking identifier"
            />
          </>
        )}
      </FormSection>

      {/* Date Range */}
      <FormSection title="Date Range" description="Set the active period for this featured tool">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DateField
            name="start_date"
            label="Start Date"
            value={formData.start_date ? new Date(formData.start_date) : null}
            onChange={(v) => updateField('start_date', v ?? undefined)}
            error={errors.start_date}
            helpText="When the feature starts (defaults to today)"
          />

          <DateField
            name="end_date"
            label="End Date"
            value={formData.end_date ? new Date(formData.end_date) : null}
            onChange={(v) => updateField('end_date', v ?? undefined)}
            minDate={formData.start_date ? new Date(formData.start_date) : undefined}
            error={errors.end_date}
            helpText="When the feature ends (must be after start date)"
          />
        </div>
      </FormSection>

      {/* Analytics (Read-only) */}
      {!isNew && initialData && (
        <FormSection title="Analytics" description="Performance metrics (read-only)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadOnlyField
              label="Impressions"
              value={String((initialData.impression_count ?? 0).toLocaleString())}
            />
            <ReadOnlyField
              label="Clicks"
              value={String((initialData.click_count ?? 0).toLocaleString())}
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

      {/* Tool Details Section (Requirements: 20.4, 20.5, 20.6) */}
      {formData.tool_id && (
        <RelatedDataSection
          title="Selected Tool Details"
          items={toolDetails ? [{
            id: toolDetails.id,
            label: toolDetails.name,
            href: `/admin/tools/${toolDetails.id}/edit`,
            sublabel: `${toolDetails.website_url} • Status: ${toolDetails.status}`,
          }] : []}
          totalCount={toolDetails ? 1 : 0}
          viewAllHref={toolDetails ? `/admin/tools/${toolDetails.id}/edit` : undefined}
          isLoading={isLoadingToolDetails}
          emptyMessage="Tool details not available"
          maxItems={10}
          defaultExpanded={true}
        />
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/featured')}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Saving...' : isNew ? 'Create Featured Tool' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
