'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/admin/Toast';
import { validateSocialUrl } from '@/lib/utils/validation';
import { Button } from '@/components/ui/button';
import { createLogger } from '@/lib/logger';

const log = createLogger('AdminSocialLinksPage');
import {
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Save,
  Loader2,
  Share2,
  Users,
  HelpCircle,
  ExternalLink,
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
  community_url?: string;
  help_center_url?: string;
}

interface PlatformConfig {
  key: keyof SocialLinksFormData;
  label: string;
  icon: LucideIcon;
  placeholder: string;
}

interface SectionConfig {
  title: string;
  description: string;
  icon: LucideIcon;
  platforms: PlatformConfig[];
}

// ============================================================================
// Constants
// ============================================================================

const SOCIAL_MEDIA_PLATFORMS: PlatformConfig[] = [
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

const EXTERNAL_LINK_PLATFORMS: PlatformConfig[] = [
  {
    key: 'community_url',
    label: 'Community',
    icon: Users,
    placeholder: 'https://community.yoursite.com',
  },
  {
    key: 'help_center_url',
    label: 'Help Center',
    icon: HelpCircle,
    placeholder: 'https://help.yoursite.com',
  },
];

const SECTIONS: SectionConfig[] = [
  {
    title: 'Social Media',
    description: 'Social media profile links displayed in the website footer.',
    icon: Share2,
    platforms: SOCIAL_MEDIA_PLATFORMS,
  },
  {
    title: 'External Links',
    description: 'External resource links displayed in the footer Resources section.',
    icon: ExternalLink,
    platforms: EXTERNAL_LINK_PLATFORMS,
  },
];

const ALL_PLATFORMS = [...SOCIAL_MEDIA_PLATFORMS, ...EXTERNAL_LINK_PLATFORMS];

const INITIAL_FORM_DATA: SocialLinksFormData = {
  twitter_url: '',
  linkedin_url: '',
  facebook_url: '',
  instagram_url: '',
  community_url: '',
  help_center_url: '',
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * Social Links Admin Page
 *
 * Allows administrators to view and edit social media link URLs and external links.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 5.1, 5.2, 5.3, 5.4
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
      log.error('Error fetching social links', error, { action: 'fetchSocialLinks' });
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
  // Requirements: 1.4, 1.6, 1.7, 5.3
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    for (const platform of ALL_PLATFORMS) {
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
  // Requirements: 1.4, 1.5, 5.4
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
      log.error('Error saving social links', error, { action: 'saveSocialLinks' });
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
            Manage social media and external links displayed in the website footer
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
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Sections */}
            {SECTIONS.map((section, sectionIndex) => {
              const SectionIcon = section.icon;
              return (
                <div key={section.title} className="space-y-4">
                  {/* Section Header */}
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <SectionIcon className="w-5 h-5 text-gray-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                      <p className="text-sm text-gray-500">{section.description}</p>
                    </div>
                  </div>

                  {/* Platform URL Fields */}
                  <div className="space-y-4 pl-7">
                    {section.platforms.map((platform) => {
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
                          {/* Requirements: 1.6, 5.3 - Display validation error for invalid fields */}
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

                  {/* Add spacing between sections except for the last one */}
                  {sectionIndex < SECTIONS.length - 1 && <div className="pt-4" />}
                </div>
              );
            })}

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
