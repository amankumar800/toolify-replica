'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DataTable, type Column, type Filter, type RowAction, type BulkAction, type SortConfig } from '@/components/admin/DataTable';
import { useToast } from '@/components/admin/Toast';
import { DeleteModal } from '@/components/admin/DeleteModal';
import { exportToCSV, downloadCSV } from '@/lib/utils/csv-export';
import { createLogger } from '@/lib/logger';

const log = createLogger('AdminToolsPage');
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Eye,
  RotateCcw,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';
import type { ToolStatus, ToolPricing, ToolPlatform } from '@/lib/types/admin-forms';

// ============================================================================
// Types
// ============================================================================

interface ToolListItem {
  id: string;
  name: string;
  slug: string;
  status: ToolStatus | null;
  pricing: string | null;
  platform: string | null;
  is_featured: boolean | null;
  created_at: string | null;
  website_url: string;
  categories: { id: string; name: string; slug: string }[];
}

interface ToolsListResponse {
  data: ToolListItem[];
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

const STATUS_OPTIONS: { value: ToolStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
];

const PRICING_OPTIONS: { value: ToolPricing; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'freemium', label: 'Freemium' },
  { value: 'paid', label: 'Paid' },
  { value: 'contact', label: 'Contact' },
];

const FEATURED_OPTIONS = [
  { value: 'true', label: 'Featured' },
  { value: 'false', label: 'Not Featured' },
];

const PLATFORM_OPTIONS: { value: ToolPlatform; label: string }[] = [
  { value: 'web', label: 'Web' },
  { value: 'app', label: 'Mobile App' },
  { value: 'browser-extension', label: 'Browser Extension' },
  { value: 'discord', label: 'Discord' },
  { value: 'api', label: 'API' },
];

// ============================================================================
// Helper Components
// ============================================================================

function StatusBadge({ status }: { status: ToolStatus | null }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
    published: { bg: 'bg-green-100', text: 'text-green-700', label: 'Published' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
    archived: { bg: 'bg-gray-200', text: 'text-gray-500', label: 'Archived' },
  };

  const config = statusConfig[status ?? 'draft'] ?? statusConfig.draft;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

function PricingBadge({ pricing }: { pricing: string | null }) {
  const pricingConfig: Record<string, { bg: string; text: string }> = {
    free: { bg: 'bg-green-50', text: 'text-green-700' },
    freemium: { bg: 'bg-blue-50', text: 'text-blue-700' },
    paid: { bg: 'bg-purple-50', text: 'text-purple-700' },
    contact: { bg: 'bg-orange-50', text: 'text-orange-700' },
  };

  const config = pricingConfig[pricing ?? ''] ?? { bg: 'bg-gray-50', text: 'text-gray-600' };
  const label = pricing ? pricing.charAt(0).toUpperCase() + pricing.slice(1) : 'N/A';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
      {label}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: string | null }) {
  const platformConfig: Record<string, { bg: string; text: string; icon: string; label: string }> = {
    web: { bg: 'bg-gray-100', text: 'text-gray-700', icon: '🌐', label: 'Web' },
    app: { bg: 'bg-purple-100', text: 'text-purple-700', icon: '📱', label: 'Mobile' },
    'browser-extension': { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🧩', label: 'Extension' },
    discord: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: '💬', label: 'Discord' },
    api: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '⚡', label: 'API' },
  };

  const config = platformConfig[platform ?? 'web'] ?? platformConfig.web;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ToolsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  // State
  const [tools, setTools] = useState<ToolListItem[]>([]);
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
    tool: ToolListItem | null;
    isPermanent: boolean;
  }>({ isOpen: false, tool: null, isPermanent: false });
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch tools
  const fetchTools = useCallback(async () => {
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

      const response = await fetch(`/api/admin/tools?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tools');
      }

      const data: ToolsListResponse = await response.json();
      setTools(data.data);
      setPagination(data.pagination);
    } catch (error) {
      log.error('Error fetching tools', error, { action: 'fetchTools' });
      addToast({
        variant: 'error',
        message: 'Failed to load tools. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.pageSize, sort, filterValues, searchQuery, addToast]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  // Column definitions
  // Requirements: 3.1 - Display columns: Name, Slug, Status, Pricing, Is Featured, Created Date
  const columns: Column<ToolListItem>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (_, row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <a
            href={row.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline flex items-center gap-1"
          >
            Visit <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      ),
    },
    {
      key: 'slug',
      label: 'Slug',
      sortable: false,
      render: (value) => (
        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{String(value)}</code>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value as ToolStatus | null} />,
    },
    {
      key: 'pricing',
      label: 'Pricing',
      sortable: false,
      render: (value) => <PricingBadge pricing={value as string | null} />,
    },
    {
      key: 'platform',
      label: 'Platform',
      sortable: false,
      render: (value) => <PlatformBadge platform={value as string | null} />,
    },
    {
      key: 'is_featured',
      label: 'Featured',
      sortable: false,
      render: (value) => (
        value ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <X className="w-4 h-4 text-gray-300" />
        )
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
  // Requirements: 3.5 - Filtering by status, is_featured, pricing
  const filters: Filter[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: STATUS_OPTIONS,
    },
    {
      key: 'pricing',
      label: 'Pricing',
      type: 'select',
      options: PRICING_OPTIONS,
    },
    {
      key: 'platform',
      label: 'Platform',
      type: 'select',
      options: PLATFORM_OPTIONS,
    },
    {
      key: 'is_featured',
      label: 'Featured',
      type: 'select',
      options: FEATURED_OPTIONS,
    },
  ];

  // Row actions
  // Requirements: 3.6 - Row actions: Edit, Delete
  // Requirements: 19.3, 19.4, 19.5, 19.6 - Archived tool actions
  const rowActions: RowAction<ToolListItem>[] = [
    {
      label: 'Edit',
      icon: Pencil,
      onClick: (row) => router.push(`/admin/tools/${row.id}/edit`),
    },
    {
      label: 'Preview',
      icon: Eye,
      onClick: (row) => window.open(`/tool/${row.slug}`, '_blank'),
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (row) => setDeleteModal({ isOpen: true, tool: row, isPermanent: false }),
      condition: (row) => row.status !== 'archived',
    },
    {
      label: 'Restore',
      icon: RotateCcw,
      onClick: (row) => handleRestore(row.id),
      condition: (row) => row.status === 'archived',
    },
    {
      label: 'Permanently Delete',
      icon: AlertTriangle,
      variant: 'destructive',
      onClick: (row) => setDeleteModal({ isOpen: true, tool: row, isPermanent: true }),
      condition: (row) => row.status === 'archived',
    },
  ];

  // Bulk actions
  // Requirements: 3.7 - Bulk actions: Publish, Unpublish, Delete
  const bulkActions: BulkAction[] = [
    {
      label: 'Publish',
      onClick: (ids) => handleBulkStatusChange(ids, 'published'),
    },
    {
      label: 'Unpublish',
      onClick: (ids) => handleBulkStatusChange(ids, 'draft'),
    },
    {
      label: 'Delete',
      variant: 'destructive',
      onClick: (ids) => handleBulkDelete(ids),
      confirmMessage: 'Are you sure you want to delete the selected tools?',
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
    if (!deleteModal.tool) return;

    setIsDeleting(true);
    try {
      const endpoint = deleteModal.isPermanent
        ? `/api/admin/tools/${deleteModal.tool.id}/permanent`
        : `/api/admin/tools/${deleteModal.tool.id}`;

      const response = await fetch(endpoint, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error('Failed to delete tool');
      }

      addToast({
        variant: 'success',
        message: deleteModal.isPermanent
          ? 'Tool permanently deleted'
          : 'Tool archived successfully',
      });

      setDeleteModal({ isOpen: false, tool: null, isPermanent: false });
      fetchTools();
    } catch (error) {
      log.error('Error deleting tool', error, { action: 'deleteTool' });
      addToast({
        variant: 'error',
        message: 'Failed to delete tool. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/tools/${id}/restore`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to restore tool');
      }

      addToast({
        variant: 'success',
        message: 'Tool restored successfully',
      });

      fetchTools();
    } catch (error) {
      log.error('Error restoring tool', error, { action: 'restoreTool' });
      addToast({
        variant: 'error',
        message: 'Failed to restore tool. Please try again.',
      });
    }
  };

  const handleBulkStatusChange = async (ids: string[], status: ToolStatus) => {
    try {
      const response = await fetch('/api/admin/tools/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update tools');
      }

      addToast({
        variant: 'success',
        message: `${ids.length} tool(s) updated to ${status}`,
      });

      fetchTools();
    } catch (error) {
      log.error('Error updating tools', error, { action: 'bulkStatusChange' });
      addToast({
        variant: 'error',
        message: 'Failed to update tools. Please try again.',
      });
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const response = await fetch('/api/admin/tools/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete tools');
      }

      addToast({
        variant: 'success',
        message: `${ids.length} tool(s) archived`,
      });

      fetchTools();
    } catch (error) {
      log.error('Error deleting tools', error, { action: 'bulkDelete' });
      addToast({
        variant: 'error',
        message: 'Failed to delete tools. Please try again.',
      });
    }
  };

  // Export handler
  // Requirements: 17.1 - Export CSV button
  const handleExport = () => {
    const result = exportToCSV(tools as unknown as Record<string, unknown>[], {
      tableName: 'tools',
      columns: ['name', 'slug', 'status', 'pricing', 'is_featured', 'website_url'],
    });

    downloadCSV(result);

    addToast({
      variant: 'success',
      message: `Exported ${result.recordCount} tools to ${result.filename}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Manage Tools</h2>
          <p className="text-gray-500 mt-1">
            {pagination.total} tool{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/tools/new">
            <Plus className="w-4 h-4 mr-2" /> Add Tool
          </Link>
        </Button>
      </div>

      {/* Include Archived Toggle */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={filterValues.includeArchived === 'true'}
            onChange={(e) => {
              handleFilter({
                ...filterValues,
                includeArchived: e.target.checked ? 'true' : undefined,
              });
            }}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Show archived tools
        </label>
      </div>

      {/* Data Table */}
      <DataTable
        data={tools}
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
        emptyMessage="No tools found. Create your first tool to get started."
        enableSelection={true}
        onExport={handleExport}
        getRowId={(row) => row.id}
        getRowClassName={(row) => row.status === 'archived' ? 'bg-gray-100' : ''}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, tool: null, isPermanent: false })}
        onConfirm={handleDelete}
        title={deleteModal.isPermanent ? 'Permanently Delete Tool' : 'Archive Tool'}
        recordName={deleteModal.tool?.name ?? ''}
        requireConfirmation={deleteModal.isPermanent}
        isLoading={isDeleting}
      />
    </div>
  );
}
