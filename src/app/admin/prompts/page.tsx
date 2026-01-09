'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DataTable, type Column, type Filter, type RowAction, type BulkAction, type SortConfig } from '@/components/admin/DataTable';
import { useToast } from '@/components/admin/Toast';
import { DeleteModal } from '@/components/admin/DeleteModal';
import { exportToCSV, downloadCSV } from '@/lib/utils/csv-export';
import { createLogger } from '@/lib/logger';

const log = createLogger('AdminPromptsPage');
import {
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Image,
} from 'lucide-react';
import type { PromptType } from '@/lib/types/admin-forms';

// ============================================================================
// Types
// ============================================================================

interface PromptListItem {
  id: string;
  title: string;
  slug: string;
  type: string;
  tags: string[] | null;
  view_count: number | null;
  copy_count: number | null;
  created_at: string | null;
}

interface PromptListResponse {
  data: PromptListItem[];
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

const TYPE_OPTIONS: { value: PromptType; label: string }[] = [
  { value: 'sref', label: 'SREF' },
  { value: 'prompt', label: 'Prompt' },
];

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Type badge component
 * Requirements: 8.1 - Display Type column
 */
function TypeBadge({ type }: { type: string }) {
  const isSref = type === 'sref';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        isSref
          ? 'bg-purple-100 text-purple-700'
          : 'bg-blue-100 text-blue-700'
      }`}
    >
      {isSref ? (
        <Image className="w-3 h-3 mr-1" />
      ) : (
        <Sparkles className="w-3 h-3 mr-1" />
      )}
      {isSref ? 'SREF' : 'Prompt'}
    </span>
  );
}

/**
 * Tags display component (truncated)
 * Requirements: 8.1 - Display Tags (truncated)
 */
function TagsDisplay({ tags }: { tags: string[] | null }) {
  if (!tags || tags.length === 0) {
    return <span className="text-gray-400">—</span>;
  }

  const displayTags = tags.slice(0, 3);
  const remaining = tags.length - 3;

  return (
    <div className="flex flex-wrap gap-1">
      {displayTags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
        >
          {tag}
        </span>
      ))}
      {remaining > 0 && (
        <span className="text-xs text-gray-400">+{remaining} more</span>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Prompts List Page
 *
 * Displays a paginated, filterable, sortable list of Midjourney prompts.
 *
 * Requirements: 8.1, 8.2, 8.3
 */
export default function PromptsPage() {
  const router = useRouter();
  const { addToast } = useToast();

  // State
  const [prompts, setPrompts] = useState<PromptListItem[]>([]);
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
    prompt: PromptListItem | null;
  }>({ isOpen: false, prompt: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch prompts
  const fetchPrompts = useCallback(async () => {
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

      const response = await fetch(`/api/admin/prompts?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch prompts');
      }

      const data: PromptListResponse = await response.json();
      setPrompts(data.data);
      setPagination(data.pagination);
    } catch (error) {
      log.error('Error fetching prompts', error, { action: 'fetchPrompts' });
      addToast({
        variant: 'error',
        message: 'Failed to load prompts. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.pageSize, sort, filterValues, searchQuery, addToast]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // Column definitions
  // Requirements: 8.1 - Display columns: Title, Type, Tags (truncated), View Count, Copy Count
  const columns: Column<PromptListItem>[] = [
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
      key: 'type',
      label: 'Type',
      sortable: false,
      render: (value) => <TypeBadge type={value as string} />,
    },
    {
      key: 'tags',
      label: 'Tags',
      sortable: false,
      hideOnMobile: true,
      render: (value) => <TagsDisplay tags={value as string[] | null} />,
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
      key: 'copy_count',
      label: 'Copies',
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
  // Requirements: 8.2 - Filter by type (sref/prompt)
  const filters: Filter[] = [
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: TYPE_OPTIONS,
    },
  ];

  // Row actions
  // Requirements: 8.3 - Row actions: Edit, Delete
  const rowActions: RowAction<PromptListItem>[] = [
    {
      label: 'Edit',
      icon: Pencil,
      onClick: (row) => router.push(`/admin/prompts/${row.id}/edit`),
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (row) => setDeleteModal({ isOpen: true, prompt: row }),
    },
  ];

  // Bulk actions
  const bulkActions: BulkAction[] = [
    {
      label: 'Delete',
      variant: 'destructive',
      onClick: (ids) => handleBulkDelete(ids),
      confirmMessage: 'Are you sure you want to delete the selected prompts?',
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
    if (!deleteModal.prompt) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/prompts/${deleteModal.prompt.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete prompt');
      }

      addToast({
        variant: 'success',
        message: 'Prompt deleted successfully',
      });

      setDeleteModal({ isOpen: false, prompt: null });
      fetchPrompts();
    } catch (error) {
      log.error('Error deleting prompt', error, { action: 'deletePrompt' });
      addToast({
        variant: 'error',
        message: 'Failed to delete prompt. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const response = await fetch('/api/admin/prompts/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete prompts');
      }

      addToast({
        variant: 'success',
        message: `${ids.length} prompt(s) deleted`,
      });

      fetchPrompts();
    } catch (error) {
      log.error('Error deleting prompts', error, { action: 'bulkDelete' });
      addToast({
        variant: 'error',
        message: 'Failed to delete prompts. Please try again.',
      });
    }
  };

  // Export handler
  const handleExport = () => {
    // Convert to Record<string, unknown>[] for CSV export
    const exportData = prompts.map((item) => ({
      ...item,
      tags: item.tags?.join(', ') ?? '',
    })) as unknown as Record<string, unknown>[];

    const result = exportToCSV(exportData, {
      tableName: 'midjourney_prompts',
      columns: ['title', 'slug', 'type', 'tags', 'view_count', 'copy_count'],
    });

    downloadCSV(result);

    addToast({
      variant: 'success',
      message: `Exported ${result.recordCount} prompts to ${result.filename}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Prompts</h2>
          <p className="text-gray-500 mt-1">
            {pagination.total} prompt{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/prompts/new">
            <Plus className="w-4 h-4 mr-2" /> Add Prompt
          </Link>
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        data={prompts}
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
        emptyMessage="No prompts found. Create your first prompt to get started."
        enableSelection={true}
        onExport={handleExport}
        getRowId={(row) => row.id}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, prompt: null })}
        onConfirm={handleDelete}
        title="Delete Prompt"
        recordName={deleteModal.prompt?.title ?? ''}
        isLoading={isDeleting}
      />
    </div>
  );
}
