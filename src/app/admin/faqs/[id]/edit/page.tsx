'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { FAQForm } from '@/components/admin/FAQForm';
import { useToast } from '@/components/admin/Toast';
import type { FAQFormData } from '@/lib/types/admin-forms';

interface EditFAQPageProps {
  params: Promise<{ id: string }>;
}

interface FAQData extends FAQFormData {
  id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Edit FAQ Page
 *
 * Fetches and renders the FAQ form for editing an existing FAQ.
 *
 * Requirements: 9.5
 */
export default function EditFAQPage({ params }: EditFAQPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  const [faq, setFaq] = useState<FAQData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFAQ = async () => {
      try {
        const response = await fetch(`/api/admin/faqs/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            addToast({
              variant: 'error',
              message: 'FAQ not found',
            });
            router.push('/admin/faqs');
            return;
          }
          throw new Error('Failed to fetch FAQ');
        }

        const data = await response.json();
        setFaq(data);
      } catch (error) {
        console.error('Error fetching FAQ:', error);
        addToast({
          variant: 'error',
          message: 'Failed to load FAQ. Please try again.',
        });
        router.push('/admin/faqs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFAQ();
  }, [id, router, addToast]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Page Header Skeleton */}
        <div>
          <div className="h-9 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-64 bg-gray-200 rounded animate-pulse mt-2" />
        </div>

        {/* Form Skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="space-y-6">
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!faq) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Edit FAQ</h2>
        <p className="text-gray-500 mt-1">
          Update the FAQ details
        </p>
      </div>

      {/* FAQ Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <FAQForm initialData={faq} isNew={false} />
      </div>
    </div>
  );
}
