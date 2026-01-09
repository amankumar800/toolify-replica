'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/admin/Toast';
import { Button } from '@/components/ui/button';
import { createLogger } from '@/lib/logger';

const log = createLogger('AdminCompanyPagesPage');
import {
  FileText,
  Pencil,
  Loader2,
} from 'lucide-react';
import type { CompanyPageRow } from '@/lib/supabase/types';

/**
 * Company Pages List Page
 *
 * Displays a list of all company pages (About Us, Contact, Privacy Policy, Terms of Service)
 * with their title, last updated date, and an Edit button.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export default function CompanyPagesPage() {
  const { addToast } = useToast();

  // State
  const [pages, setPages] = useState<CompanyPageRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch company pages on mount
  // Requirements: 1.1 - Display a list of all four company pages
  const fetchPages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/company-pages');
      if (!response.ok) {
        throw new Error('Failed to fetch company pages');
      }

      const result = await response.json();
      setPages(result.data || []);
    } catch (error) {
      log.error('Error fetching company pages', error, { action: 'fetchPages' });
      addToast({
        variant: 'error',
        message: 'Failed to load company pages. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // Format date for display
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="w-8 h-8 text-gray-700" />
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Company Pages</h2>
          <p className="text-gray-500 mt-1">
            Manage content for company information pages
          </p>
        </div>
      </div>

      {/* Pages List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">Loading company pages...</span>
          </div>
        ) : pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <FileText className="w-12 h-12 text-gray-300 mb-3" />
            <p>No company pages found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Page
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Requirements: 1.2 - Display each page with its title and last updated date */}
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <code className="text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                          /{page.slug}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{page.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {formatDate(page.updated_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* Requirements: 1.3, 1.4 - Edit button linking to edit page */}
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/company-pages/${page.slug}/edit`}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
