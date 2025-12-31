'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DataTable, type Column, type Filter, type RowAction, type SortConfig } from '@/components/admin/DataTable';
import { useToast } from '@/components/admin/Toast';
import { DeleteModal } from '@/components/admin/DeleteModal';
import { exportToCSV, downloadCSV } from '@/lib/utils/csv-export';
import {
  Plus,
  Pencil,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Star,
} from 'lucide-react';
import type { FeaturedPlacementType } from '@/lib/types/admin-forms';
import type { FeaturedToolStatus } from '@/lib/services/admin-crud.types';

// ============================================================================
// Types
// ============================================================================

interface FeaturedToolListItem {
  id: string;
  tool_id: string;
  tool_name: string;
  tool_slug: string;
  placement_type: string | null;
  is_sponsored: boolean | null;
  sponsor_name: string | null;
  campaign_id: string | null;
  start_date: string | null;
  end_date: string | null;
  display_order: number | null;
  impression_count: number | null;
  click_count: number | null;
  created_at: string | null;
  status: FeaturedToolStatus;
}

interface FeaturedToolListResponse {
  data: FeaturedToolListItem[];
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

const PLACEMENT_OPTIONS: { value: FeaturedPlacementType; label: string }[] = [
  { value: 'homepage', label: 'Homepage' },
  { value: 'category', label: 'Category' },
  { value: 'search', label: 'Search' },
];

const SPONSORED_OPTIONS = [
  { value: 'true', label: 'Sponsored' },
  { value: 'false', label: 'Not Sponsored' },
];

const STATUS_OPTIONS: { value: FeaturedToolStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'expired', label: 'Expired' },
];

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Status badge component
 * Requirements: 10.3 - Calculate status from start_date/end_date
 */
function StatusBadge({ status }: { status: FeaturedToolStatus }) {
  const config: Record<FeaturedToolStatus, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    active: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      icon: <CheckCircle className="w-3 h-3 mr-1" />,
      label: 'Active',
    },
    scheduled: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      icon: <Clock className="w-3 h-3 mr-1" />,
      label: 'Scheduled',
    },
    expired: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      icon: <XCircle className="w-3 h-3 mr-1" />,
      label: 'Expired',
    },
  };

  const { bg, text, icon, label } = config[status];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
      {icon}
      {label}
    </span>
  );
}

function PlacementBadge({ placement }: { placement: string | null }) {
  const placementConfig: Record<string, { bg: string; text: string }> = {
    homepage: { bg: 'bg-purple-50', text: 'text-purple-700' },
    category: { bg: 'bg-blue-50', text: 'text-blue-700' },
    search: { bg: 'bg-orange-50', text: 'text-orange-700' },
  };

  const config = placementConfig[placement ?? ''] ?? { bg: 'bg-gray-50', text: 'text-gray-600' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
      {placement ?? 'None'}
    </span>
  );
}

function SponsorBadge({ isSponsored, sponsorName }: { isSponsored: boolean | null; sponsorName: string | null }) {
  if (!isSponsored) {
    return <span className="text-gray-400">—</span>;
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700">
      <Star className="w-3 h-3 mr-1" />
      {sponsorName ?? 'Sponsored'}
    </span>
  );
}

function DateRange({ startDate, endDate }: { startDate: string | null; endDate: string | null }) {
  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="text-sm">
      <span className="text-gray-600">{formatDate(startDate)}</span>
      <span className="text-gray-400 mx-1">→</span>
      <span className="text-gray-600">{formatDate(endDate)}</span>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Featured Tools List Page
 *
 * Displays a paginated, filterable, sortable list of featured tools.
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */
export default function FeaturedToolsPage() {
  const router = useRouter();
  const { addToast } = useToast();

  // State
  const [featuredTools, setFeaturedTools] = useState<FeaturedToolListItem[]>([]);
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
    featuredTool: FeaturedToolListItem | null;
  }>({ isOpen: false, featuredTool: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch featured tools
  const fetchFeaturedTools = useCallback(async () => {
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

      const response = await fetch(`/api/admin/featured?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch featured tools');
      }

      const data: FeaturedToolListResponse = await response.json();
      setFeaturedTools(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching featured tools:', error);
      addToast({
        variant: 'error',
        message: 'Failed to load featured tools. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.pageSize, sort, filterValues, searchQuery, addToast]);

  useEffect(() => {
    fetchFeaturedTools();
  }, [fetchFeaturedTools]);

  // Column definitions
  // Requirements: 10.1 - Display columns: Tool Name, Placement, Sponsor, Date Range, Status, Impressions, Clicks
  const columns: Column<FeaturedToolListItem>[] = [
    {
      key: 'tool_name',
      label: 'Tool Name',
      sortable: true,
      render: (_, row) => (
        <div>
          <div className="font-medium text-gray-900">{row.tool_name}</div>
          <code className="text-xs text-gray-500">{row.tool_slug}</code>
        </div>
      ),
    },
    {
      key: 'placement_type',
      label: 'Placement',
      sortable: false,
      render: (value) => <PlacementBadge placement={value as string | null} />,
    },
    {
      key: 'sponsor_name',
      label: 'Sponsor',
      sortable: false,
      render: (_, row) => (
        <SponsorBadge isSponsored={row.is_sponsored} sponsorName={row.sponsor_name} />
      ),
    },
    {
      key: 'start_date',
      label: 'Date Range',
      sortable: true,
      hideOnMobile: true,
      render: (_, row) => <DateRange startDate={row.start_date} endDate={row.end_date} />,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      render: (value) => <StatusBadge status={value as FeaturedToolStatus} />,
    },
    {
      key: 'impression_count',
      label: 'Impressions',
      sortable: true,
      hideOnMobile: true,
      render: (value) => (
        <span className="text-gray-600">{((value as number | null) ?? 0).toLocaleString()}</span>
      ),
    },
    {
      key: 'click_count',
      label: 'Clicks',
      sortable: true,
      hideOnMobile: true,
      render: (value) => (
        <span className="text-gray-600">{((value as number | null) ?? 0).toLocaleString()}</span>
      ),
    },
  ];

  // Filter definitions
  // Requirements: 10.2 - Filtering by placement_type, is_sponsored, status
  const filters: Filter[] = [
    {
      key: 'placement_type',
      label: 'Placement',
      type: 'select',
      options: PLACEMENT_OPTIONS,
    },
    {
      key: 'is_sponsored',
      label: 'Sponsored',
      type: 'select',
      options: SPONSORED_OPTIONS,
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: STATUS_OPTIONS,
    },
  ];

  // Row actions
  // Requirements: 10.4 - Row actions: Edit, Delete
  const rowActions: RowAction<FeaturedToolListItem>[] = [
    {
      label: 'Edit',
      icon: Pencil,
      onClick: (row) => router.push(`/admin/featured/${row.id}/edit`),
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (row) => setDeleteModal({ isOpen: true, featuredTool: row }),
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
    if (!deleteModal.featuredTool) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/featured/${deleteModal.featuredTool.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete featured tool');
      }

      addToast({
        variant: 'success',
        message: 'Featured tool deleted successfully',
      });

      setDeleteModal({ isOpen: false, featuredTool: null });
      fetchFeaturedTools();
    } catch (error) {
      console.error('Error deleting featured tool:', error);
      addToast({
        variant: 'error',
        message: 'Failed to delete featured tool. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Export handler
  const handleExport = () => {
    const exportData = featuredTools.map((item) => ({
      ...item,
    })) as unknown as Record<string, unknown>[];

    const result = exportToCSV(exportData, {
      tableName: 'featured_tools',
      columns: ['tool_name', 'placement_type', 'sponsor_name', 'start_date', 'end_date', 'status', 'impression_count', 'click_count'],
    });

    downloadCSV(result);

    addToast({
      variant: 'success',
      message: `Exported ${result.recordCount} featured tools to ${result.filename}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Featured Tools</h2>
          <p className="text-gray-500 mt-1">
            {pagination.total} featured tool{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/featured/new">
            <Plus className="w-4 h-4 mr-2" /> Add Featured Tool
          </Link>
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        data={featuredTools}
        columns={columns}
        filters={filters}
        rowActions={rowActions}
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
        emptyMessage="No featured tools found. Create your first featured tool to get started."
        enableSelection={false}
        onExport={handleExport}
        getRowId={(row) => row.id}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, featuredTool: null })}
        onConfirm={handleDelete}
        title="Delete Featured Tool"
        recordName={deleteModal.featuredTool?.tool_name ?? ''}
        isLoading={isDeleting}
      />
    </div>
  );
}
