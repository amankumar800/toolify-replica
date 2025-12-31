'use client';

import Link from 'next/link';
import { Eye, ArrowLeft, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Props for the DraftPreviewBanner component
 */
interface DraftPreviewBannerProps {
  /** Type of content being previewed */
  contentType: 'tool' | 'news';
  /** ID of the content for the edit link */
  contentId: string;
  /** Optional custom message */
  message?: string;
}

/**
 * DraftPreviewBanner Component
 *
 * Displays a prominent banner at the top of preview pages for unpublished content.
 * Indicates that the content is a draft and provides a link back to the admin edit page.
 *
 * Requirements: 18.4 - IF the record is not published, THEN THE Preview page SHALL show a draft preview banner
 */
export function DraftPreviewBanner({
  contentType,
  contentId,
  message,
}: DraftPreviewBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  const editHref = contentType === 'tool'
    ? `/admin/tools/${contentId}/edit`
    : `/admin/news/${contentId}/edit`;

  const defaultMessage = 'This is a draft preview. This content is not yet published and is only visible to administrators.';

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 shadow-lg"
      role="alert"
      aria-live="polite"
      data-testid="draft-preview-banner"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="font-semibold">Draft Preview</span>
              <span className="text-sm text-amber-900">
                {message || defaultMessage}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={editHref}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Back to Editor</span>
              <span className="sm:hidden">Edit</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1.5 hover:bg-amber-600 rounded-md transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
