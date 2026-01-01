'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/admin/Toast';
import { validateSocialUrl } from '@/lib/utils/validation';
import { Button } from '@/components/ui/button';
import {
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Save,
  Loader2,
  Share2,
} from 'lucide-react';
import type { SocialLinksFormData } from '@/lib/supabase/types';
import type { LucideIcon } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface FormErrors {
  twitter_url?: string;
  linkedin_url?: string;
  facebook_url?: string;
  instagram_url?: string;
}

interface PlatformConfig {
  key: keyof SocialLinksFormData;
  label: string;
  icon: LucideIcon;
  placeholder: string;
}

// ============================================================================
// Constants
// ============================================================================

const PLATFORMS: PlatformConfig[] = [
  {
    key: 'twitter_url',
    label: 'Twitter',
    icon: Twitter,
    placeholder: 'https://twitter.com/yourhandle',
  },
  {
    key: 'linkedin_url',
    label: 'LinkedIn',
    icon: Linkedin,
    placeholder: 'https://linkedin.com/company/yourcompany',
  },
  {
    key: 'facebook_url',
    label: 'Facebook',
    icon: Facebook,
    placeholder: 'https://facebook.com/yourpage',
  },
  {
    key: 'instagram_url',
    label: 'Instagram',
    icon: Instagram,
    placeholder: 'https://instagram.com/yourhandle',
  },
];

const INITIAL_FORM_DATA: SocialLinksFormData = {
  twitter_url: '',
  linkedin_url: '',
  facebook_url: '',
  instagram_url: '',
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * Social Links Admin Page
 *
 * Allows administrators to view and edit social media link URLs.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */
export default function SocialLinksPage() {
  const { addToast } = useToast();

  // State
  const [formData, setFormData] = useState<SocialLinksFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current social links on mount
  // Requirements: 1.3 - Pre-populate fields with current values
  const fetchSocialLinks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/social-links');
      if (!response.ok) {
        throw new Error('Failed to fetch social links');
      }

      const result = await response.json();
      setFormData(result.data);
    } catch (error) {
      console.error('Error fetching social links:', error);
      addToast({
        variant: 'error',
        message: 'Failed to load social links. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchSocialLinks();
  }, [fetchSocialLinks]);

  // Handle input change
  const handleChange = (key: keyof SocialLinksFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  // Validate all URLs
  // Requirements: 1.4, 1.6, 1.7
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    for (const platform of PLATFORMS) {
      const url = formData[platform.key];
      const result = validateSocialUrl(url);
      if (!result.valid) {
        newErrors[platform.key] = result.error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  // Requirements: 1.4, 1.5
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate URLs
    if (!validateForm()) {
      addToast({
        variant: 'error',
        message: 'Please fix the validation errors before saving.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/social-links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save social links');
      }

      const result = await response.json();
      setFormData(result.data);

      // Requirements: 1.5 - Display success message
      addToast({
        variant: 'success',
        message: 'Social links updated successfully!',
      });
    } catch (error) {
      console.error('Error saving social links:', error);
      addToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to save social links. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Share2 className="w-8 h-8 text-gray-700" />
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Social Links</h2>
          <p className="text-gray-500 mt-1">
            Manage social media links displayed in the website footer
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">Loading social links...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-gray-600 mb-6">
              Enter the URLs for each social media platform. Leave a field empty to hide that platform from the footer.
            </p>

            {/* Platform URL Fields */}
            {/* Requirements: 1.1, 1.2 - Display form with all four platforms with icons */}
            <div className="space-y-4">
              {PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                const error = errors[platform.key];

                return (
                  <div key={platform.key} className="space-y-1">
                    <label
                      htmlFor={platform.key}
                      className="flex items-center gap-2 text-sm font-medium text-gray-700"
                    >
                      <Icon className="w-5 h-5" />
                      {platform.label}
                    </label>
                    <input
                      type="text"
                      id={platform.key}
                      name={platform.key}
                      value={formData[platform.key]}
                      onChange={(e) => handleChange(platform.key, e.target.value)}
                      placeholder={platform.placeholder}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        error
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300'
                      }`}
                      aria-invalid={!!error}
                      aria-describedby={error ? `${platform.key}-error` : undefined}
                    />
                    {/* Requirements: 1.6 - Display validation error for invalid fields */}
                    {error && (
                      <p
                        id={`${platform.key}-error`}
                        className="text-sm text-red-600"
                        role="alert"
                      >
                        {error}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
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
        )}
      </div>
    </div>
  );
}
