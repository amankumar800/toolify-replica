'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DataTable, type Column, type Filter, type RowAction, type BulkAction, type SortConfig } from '@/components/admin/DataTable';
import { useToast } from '@/components/admin/Toast';
import { DeleteModal } from '@/components/admin/DeleteModal';
import { exportToCSV, downloadCSV } from '@/lib/utils/csv-export';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Check,
  X,
} from 'lucide-react';
import type { NewsCategory } from '@/lib/types/admin-forms';

// ============================================================================
// Types
// ============================================================================

interface NewsListItem {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  is_published: boolean | null;
  published_at: string | null;
  view_count: number | null;
  like_count: number | null;
  created_at: string | null;
}

interface NewsListResponse {
  data: NewsListItem[];
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

const CATEGORY_OPTIONS: { value: NewsCategory; label: string }[] = [
  { value: 'AI Research', label: 'AI Research' },
  { value: 'Industry News', label: 'Industry News' },
  { value: 'Product Launch', label: 'Product Launch' },
  { value: 'Tutorial', label: 'Tutorial' },
  { value: 'Opinion', label: 'Opinion' },
];

const PUBLISHED_OPTIONS = [
  { value: 'true', label: 'Published' },
  { value: 'false', label: 'Draft' },
];

// ============================================================================
// Helper Components
// ============================================================================

function PublishedBadge({ isPublished }: { isPublished: boolean | null }) {
  if (isPublished) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
        <Check className="w-3 h-3 mr-1" />
        Published
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
      <X className="w-3 h-3 mr-1" />
      Draft
    </span>
  );
}

function CategoryBadge({ category }: { category: string | null }) {
  const categoryConfig: Record<string, { bg: string; text: string }> = {
    'AI Research': { bg: 'bg-purple-50', text: 'text-purple-700' },
    'Industry News': { bg: 'bg-blue-50', text: 'text-blue-700' },
    'Product Launch': { bg: 'bg-green-50', text: 'text-green-700' },
    'Tutorial': { bg: 'bg-orange-50', text: 'text-orange-700' },
    'Opinion': { bg: 'bg-pink-50', text: 'text-pink-700' },
  };

  const config = categoryConfig[category ?? ''] ?? { bg: 'bg-gray-50', text: 'text-gray-600' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
      {category ?? 'Uncategorized'}
    </span>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * AI News List Page
 *
 * Displays a paginated, filterable, sortable list of AI news articles.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
export default function NewsPage() {
  const router = useRouter();
  const { addToast } = useToast();

  // State
  const [news, setNews] = useState<NewsListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [sort, setSort] = useState<SortConfig>({
    key: 'created_at',
    direction: 'desc',
  });
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    news: NewsListItem | null;
  }>({ isOpen: false, news: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch news
  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('pageSize', String(pagination.pageSize));
      params.set('sortBy', sort.key);
      params.set('sortDirection', sort.direction);

      if (searchQuery) {
        params.set('search', searchQuery);
      }

      Object.entries(filterValues).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.set(key, String(value));
        }
      });

      const response = await fetch(`/api/admin/news?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data: NewsListResponse = await response.json();
      setNews(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching news:', error);
      addToast({
        variant: 'error',
        message: 'Failed to load news. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.pageSize, sort, filterValues, searchQuery, addToast]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Column definitions
  // Requirements: 7.1 - Display columns: Title, Category, Published Status, Published Date, View Count
  const columns: Column<NewsListItem>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (_, row) => (
        <div>
          <div className="font-medium text-gray-900 line-clamp-1">{row.title}</div>
          <code className="text-xs text-gray-500">{row.slug}</code>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: false,
      render: (value) => <CategoryBadge category={value as string | null} />,
    },
    {
      key: 'is_published',
      label: 'Status',
      sortable: false,
      render: (value) => <PublishedBadge isPublished={value as boolean | null} />,
    },
    {
      key: 'published_at',
      label: 'Published Date',
      sortable: true,
      hideOnMobile: true,
      render: (value) => {
        if (!value) return <span className="text-gray-400">—</span>;
        return new Date(value as string).toLocaleDateString();
      },
    },
    {
      key: 'view_count',
      label: 'Views',
      sortable: true,
      hideOnMobile: true,
      render: (value) => (
        <span className="text-gray-600">{(value as number | null) ?? 0}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      hideOnMobile: true,
      render: (value) => {
        if (!value) return 'N/A';
        return new Date(value as string).toLocaleDateString();
      },
    },
  ];

  // Filter definitions
  // Requirements: 7.2 - Filtering by is_published, category
  const filters: Filter[] = [
    {
      key: 'is_published',
      label: 'Status',
      type: 'select',
      options: PUBLISHED_OPTIONS,
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: CATEGORY_OPTIONS,
    },
  ];

  // Row actions
  // Requirements: 7.5 - Row actions: Edit, Delete, Preview
  const rowActions: RowAction<NewsListItem>[] = [
    {
      label: 'Edit',
      icon: Pencil,
      onClick: (row) => router.push(`/admin/news/${row.id}/edit`),
    },
    {
      label: 'Preview',
      icon: Eye,
      onClick: (row) => window.open(`/ai-news/${row.slug}`, '_blank'),
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (row) => setDeleteModal({ isOpen: true, news: row }),
    },
  ];

  // Bulk actions
  // Requirements: 7.4 - Bulk actions: Publish, Unpublish, Delete
  const bulkActions: BulkAction[] = [
    {
      label: 'Publish',
      onClick: (ids) => handleBulkStatusChange(ids, true),
    },
    {
      label: 'Unpublish',
      onClick: (ids) => handleBulkStatusChange(ids, false),
    },
    {
      label: 'Delete',
      variant: 'destructive',
      onClick: (ids) => handleBulkDelete(ids),
      confirmMessage: 'Are you sure you want to delete the selected news items?',
    },
  ];

  // Handlers
  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination((prev) => ({ ...prev, page: 1, pageSize }));
  };

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSort({ key, direction });
  };

  const handleFilter = (filters: Record<string, unknown>) => {
    setFilterValues(filters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDelete = async () => {
    if (!deleteModal.news) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/news/${deleteModal.news.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete news');
      }

      addToast({
        variant: 'success',
        message: 'News item deleted successfully',
      });

      setDeleteModal({ isOpen: false, news: null });
      fetchNews();
    } catch (error) {
      console.error('Error deleting news:', error);
      addToast({
        variant: 'error',
        message: 'Failed to delete news. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkStatusChange = async (ids: string[], isPublished: boolean) => {
    try {
      const response = await fetch('/api/admin/news/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, is_published: isPublished }),
      });

      if (!response.ok) {
        throw new Error('Failed to update news');
      }

      addToast({
        variant: 'success',
        message: `${ids.length} news item(s) ${isPublished ? 'published' : 'unpublished'}`,
      });

      fetchNews();
    } catch (error) {
      console.error('Error updating news:', error);
      addToast({
        variant: 'error',
        message: 'Failed to update news. Please try again.',
      });
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const response = await fetch('/api/admin/news/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete news');
      }

      addToast({
        variant: 'success',
        message: `${ids.length} news item(s) deleted`,
      });

      fetchNews();
    } catch (error) {
      console.error('Error deleting news:', error);
      addToast({
        variant: 'error',
        message: 'Failed to delete news. Please try again.',
      });
    }
  };

  // Export handler
  const handleExport = () => {
    // Convert to Record<string, unknown>[] for CSV export
    const exportData = news.map((item) => ({
      ...item,
    })) as unknown as Record<string, unknown>[];

    const result = exportToCSV(exportData, {
      tableName: 'ai_news',
      columns: ['title', 'slug', 'category', 'is_published', 'published_at', 'view_count'],
    });

    downloadCSV(result);

    addToast({
      variant: 'success',
      message: `Exported ${result.recordCount} news items to ${result.filename}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">AI News</h2>
          <p className="text-gray-500 mt-1">
            {pagination.total} article{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/news/new">
            <Plus className="w-4 h-4 mr-2" /> Add News
          </Link>
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        data={news}
        columns={columns}
        filters={filters}
        rowActions={rowActions}
        bulkActions={bulkActions}
        pagination={pagination}
        sort={sort}
        filterValues={filterValues}
        searchQuery={searchQuery}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSort={handleSort}
        onFilter={handleFilter}
        onSearch={handleSearch}
        isLoading={isLoading}
        emptyMessage="No news articles found. Create your first article to get started."
        enableSelection={true}
        onExport={handleExport}
        getRowId={(row) => row.id}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, news: null })}
        onConfirm={handleDelete}
        title="Delete News Article"
        recordName={deleteModal.news?.title ?? ''}
        isLoading={isDeleting}
      />
    </div>
  );
}
