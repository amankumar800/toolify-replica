'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/admin/Toast';
import { DeleteModal } from '@/components/admin/DeleteModal';
import { exportToCSV, downloadCSV } from '@/lib/utils/csv-export';
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  HelpCircle,
  Download,
  Search,
} from 'lucide-react';
import type { FAQCategory } from '@/lib/types/admin-forms';

// ============================================================================
// Types
// ============================================================================

interface FAQListItem {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  display_order: number | null;
  created_at: string | null;
  updated_at: string | null;
}

interface FAQListResponse {
  data: FAQListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
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

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Category badge component
 * Requirements: 9.1 - Display Category column
 */
function CategoryBadge({ category }: { category: string | null }) {
  const categoryConfig: Record<string, { bg: string; text: string }> = {
    'General': { bg: 'bg-gray-100', text: 'text-gray-700' },
    'Tools': { bg: 'bg-blue-100', text: 'text-blue-700' },
    'Account': { bg: 'bg-green-100', text: 'text-green-700' },
    'Technical': { bg: 'bg-purple-100', text: 'text-purple-700' },
  };

  const config = categoryConfig[category ?? ''] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
      {category ?? 'Uncategorized'}
    </span>
  );
}

/**
 * Truncated question display
 * Requirements: 9.1 - Question truncated to 80 chars
 */
function TruncatedQuestion({ question }: { question: string }) {
  const truncated = question.length > 80 ? `${question.slice(0, 80)}...` : question;
  return (
    <span className="font-medium text-gray-900" title={question}>
      {truncated}
    </span>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * FAQs List Page
 *
 * Displays a list of FAQs with drag-drop reordering.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */
export default function FAQsPage() {
  const router = useRouter();
  const { addToast } = useToast();

  // State
  const [faqs, setFaqs] = useState<FAQListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50, // Higher page size for drag-drop
    total: 0,
    totalPages: 0,
  });
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    faq: FAQListItem | null;
  }>({ isOpen: false, faq: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Fetch FAQs
  const fetchFAQs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('pageSize', String(pagination.pageSize));
      params.set('sortBy', 'display_order');
      params.set('sortDirection', 'asc');

      if (searchQuery) {
        params.set('search', searchQuery);
      }

      if (filterCategory) {
        params.set('category', filterCategory);
      }

      const response = await fetch(`/api/admin/faqs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch FAQs');
      }

      const data: FAQListResponse = await response.json();
      setFaqs(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      addToast({
        variant: 'error',
        message: 'Failed to load FAQs. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filterCategory, searchQuery, addToast]);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  // Handlers
  const handleDelete = async () => {
    if (!deleteModal.faq) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/faqs/${deleteModal.faq.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete FAQ');
      }

      addToast({
        variant: 'success',
        message: 'FAQ deleted successfully',
      });

      setDeleteModal({ isOpen: false, faq: null });
      fetchFAQs();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      addToast({
        variant: 'error',
        message: 'Failed to delete FAQ. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Drag and drop handlers
  // Requirements: 9.3 - Drag-drop reordering
  const handleDragStart = (index: number) => {
    setIsDragging(true);
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Reorder the list
    const newFaqs = [...faqs];
    const draggedItem = newFaqs[draggedIndex];
    newFaqs.splice(draggedIndex, 1);
    newFaqs.splice(index, 0, draggedItem);

    setFaqs(newFaqs);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    setIsDragging(false);
    setDraggedIndex(null);

    // Save new order to server
    const orders = faqs.map((faq, index) => ({
      id: faq.id,
      display_order: index + 1,
    }));

    try {
      const response = await fetch('/api/admin/faqs/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders }),
      });

      if (!response.ok) {
        throw new Error('Failed to save order');
      }

      addToast({
        variant: 'success',
        message: 'Order updated successfully',
      });

      // Refresh to get updated display_order values
      fetchFAQs();
    } catch (error) {
      console.error('Error saving order:', error);
      addToast({
        variant: 'error',
        message: 'Failed to save order. Please try again.',
      });
      // Refresh to restore original order
      fetchFAQs();
    }
  };

  // Export handler
  const handleExport = () => {
    const exportData = faqs.map((item) => ({
      ...item,
    })) as unknown as Record<string, unknown>[];

    const result = exportToCSV(exportData, {
      tableName: 'faqs',
      columns: ['question', 'answer', 'category', 'display_order'],
    });

    downloadCSV(result);

    addToast({
      variant: 'success',
      message: `Exported ${result.recordCount} FAQs to ${result.filename}`,
    });
  };

  // Filter handler
  const handleCategoryFilter = (category: string) => {
    setFilterCategory(category);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Search handler
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">FAQs</h2>
          <p className="text-gray-500 mt-1">
            {pagination.total} FAQ{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/faqs/new">
            <Plus className="w-4 h-4 mr-2" /> Add FAQ
          </Link>
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => handleCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Categories</option>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Export Button */}
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Drag-drop hint */}
      <p className="text-sm text-gray-500">
        Drag and drop rows to reorder FAQs.
      </p>

      {/* FAQs Table with drag-drop support */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-10 px-4 py-3">
                  <span className="sr-only">Drag</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Question
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                  Order
                </th>
                <th className="w-24 px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded w-4" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="h-4 bg-gray-200 rounded w-20" />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="h-4 bg-gray-200 rounded w-8" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded w-16" />
                    </td>
                  </tr>
                ))
              ) : faqs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <HelpCircle className="w-8 h-8 text-gray-300" />
                      <p className="text-sm">No FAQs found. Create your first FAQ to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                faqs.map((faq, index) => (
                  <tr
                    key={faq.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`hover:bg-gray-50 transition-colors ${
                      isDragging && draggedIndex === index ? 'opacity-50 bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                        <GripVertical className="w-4 h-4" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <TruncatedQuestion question={faq.question} />
                    </td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">
                      <CategoryBadge category={faq.category} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                      {faq.display_order ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/faqs/${faq.id}/edit`)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteModal({ isOpen: true, faq })}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, faq: null })}
        onConfirm={handleDelete}
        title="Delete FAQ"
        recordName={deleteModal.faq?.question.slice(0, 50) ?? ''}
        isLoading={isDeleting}
      />
    </div>
  );
}
