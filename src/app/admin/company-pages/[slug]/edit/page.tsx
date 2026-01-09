'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/admin/Toast';
import { TextField } from '@/components/admin/form-fields/TextField';
import { RichTextField } from '@/components/admin/form-fields/RichTextField';
import { Button } from '@/components/ui/button';
import { createLogger } from '@/lib/logger';

const log = createLogger('EditCompanyPagePage');
import {
  FileText,
  Save,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import type { CompanyPageRow, CompanyPageFormData } from '@/lib/supabase/types';

// ============================================================================
// Types
// ============================================================================

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface FormErrors {
  title?: string;
  content?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get display name for a company page slug
 */
function getPageDisplayName(slug: string): string {
  const names: Record<string, string> = {
    about: 'About Us',
    contact: 'Contact',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
  };
  return names[slug] || slug;
}

/**
 * Validate form data
 * Requirements: 2.4, 2.6, 2.7
 */
function validateFormData(data: CompanyPageFormData): FormErrors {
  const errors: FormErrors = {};

  // Title validation: must be non-empty after trimming (Req 2.4, 2.6)
  if (!data.title || data.title.trim().length === 0) {
    errors.title = 'Title is required';
  }

  // Content can be empty (Req 2.7) - no validation needed

  return errors;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Edit Company Page
 *
 * Allows administrators to edit the title and content of company pages.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */
export default function EditCompanyPagePage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  // State
  const [page, setPage] = useState<CompanyPageRow | null>(null);
  const [formData, setFormData] = useState<CompanyPageFormData>({
    title: '',
    content: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch company page on mount
  // Requirements: 2.2 - Pre-populate form with current saved content
  const fetchPage = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/admin/company-pages/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          setLoadError('Company page not found');
        } else {
          throw new Error('Failed to fetch company page');
        }
        return;
      }

      const data: CompanyPageRow = await response.json();
      setPage(data);
      setFormData({
        title: data.title,
        content: data.content || '',
      });
    } catch (error) {
      log.error('Error fetching company page', error, { action: 'fetchPage' });
      setLoadError('Failed to load company page');
      addToast({
        variant: 'error',
        message: 'Failed to load company page. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [slug, addToast]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  // Handle form field changes
  const handleChange = (field: keyof CompanyPageFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle form submission
  // Requirements: 2.4, 2.5, 2.6
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    const validationErrors = validateFormData(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      addToast({
        variant: 'error',
        message: 'Please fix the validation errors before saving.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/company-pages/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errors) {
          setErrors(errorData.errors);
        }
        throw new Error(errorData.error || 'Failed to save company page');
      }

      const result = await response.json();
      setPage(result.data);
      setFormData({
        title: result.data.title,
        content: result.data.content || '',
      });

      // Requirements: 2.5 - Display success message
      addToast({
        variant: 'success',
        message: 'Company page updated successfully!',
      });
    } catch (error) {
      log.error('Error saving company page', error, { action: 'saveCompanyPage' });
      addToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to save company page. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-500">Loading company page...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError || !page) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {loadError || 'Company page not found'}
          </h2>
          <p className="text-gray-500 mb-4">
            The company page you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/admin/company-pages"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Company Pages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/company-pages"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Back to Company Pages"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-gray-700" />
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Edit {getPageDisplayName(slug)}
            </h2>
            <p className="text-gray-500 mt-1">
              Update content for the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">/{slug}</code> page
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      {/* Requirements: 2.1 - Display form with title and content fields */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Field */}
          <TextField
            name="title"
            label="Page Title"
            value={formData.title}
            onChange={(value) => handleChange('title', value)}
            placeholder="Enter page title"
            required
            error={errors.title}
            helpText="The title displayed at the top of the page"
          />

          {/* Content Field */}
          {/* Requirements: 2.3 - Rich text editor for content */}
          <RichTextField
            name="content"
            label="Page Content"
            value={formData.content}
            onChange={(value) => handleChange('content', value)}
            placeholder="Enter page content..."
            error={errors.content}
            helpText="Use the toolbar to format text. Leave empty to show a placeholder on the frontend."
            minHeight="300px"
          />

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <Link
              href="/admin/company-pages"
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </Link>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
