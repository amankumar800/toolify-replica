'use client';

import { useState, useCallback, useEffect } from 'react';
import { DataTable, type Column, type Filter, type SortConfig } from '@/components/admin/DataTable';
import { useToast } from '@/components/admin/Toast';
import { createLogger } from '@/lib/logger';

const log = createLogger('AdminUserActivityPage');
import {
  Heart,
  Bookmark,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { UserActivityStats } from '@/lib/services/admin-crud.types';

// ============================================================================
// Types
// ============================================================================

interface UserActivityItem {
  id: string;
  user_email: string;
  tool_id: string;
  tool_name: string | null;
  is_shortcut: boolean;
  created_at: string | null;
}

interface UserActivityResponse {
  data: UserActivityItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  stats: UserActivityStats;
}

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Shortcut badge component
 */
function ShortcutBadge({ isShortcut }: { isShortcut: boolean }) {
  if (isShortcut) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
        <Bookmark className="w-3 h-3" />
        Shortcut
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
      <Heart className="w-3 h-3" />
      Favorite
    </span>
  );
}

/**
 * Stats card component
 */
function StatsCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}


/**
 * Top favorited tools list component
 * Requirements: 12.5
 */
function TopFavoritedTools({
  tools,
}: {
  tools: Array<{ tool_id: string; tool_name: string; favorite_count: number }>;
}) {
  if (tools.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No favorites yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tools.map((tool, index) => (
        <div
          key={tool.tool_id}
          className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
              {index + 1}
            </span>
            <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
              {tool.tool_name}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {tool.favorite_count} {tool.favorite_count === 1 ? 'favorite' : 'favorites'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * User Activity Page
 *
 * Displays user favorites data in a read-only DataTable with aggregate statistics.
 *
 * Requirements:
 * - 12.1: Display columns: User Email, Tool Name, Is Shortcut, Created Date
 * - 12.2: Read-only (no create/edit/delete actions)
 * - 12.3: Filter by is_shortcut
 * - 12.4: Search by user_email, tool_name
 * - 12.5: Display aggregate statistics
 */
export default function UserActivityPage() {
  const { addToast } = useToast();

  // State
  const [favorites, setFavorites] = useState<UserActivityItem[]>([]);
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({});
  const [stats, setStats] = useState<UserActivityStats>({
    totalFavorites: 0,
    totalShortcuts: 0,
    topFavoritedTools: [],
  });

  // Fetch user activity data
  const fetchUserActivity = useCallback(async () => {
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

      if (filterValues.is_shortcut !== undefined && filterValues.is_shortcut !== '') {
        params.set('is_shortcut', String(filterValues.is_shortcut));
      }

      const response = await fetch(`/api/admin/user-activity?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user activity');
      }

      const data: UserActivityResponse = await response.json();
      setFavorites(data.data);
      setPagination(data.pagination);
      setStats(data.stats);
    } catch (error) {
      log.error('Error fetching user activity', error, { action: 'fetchUserActivity' });
      addToast({
        variant: 'error',
        message: 'Failed to load user activity. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.pageSize, sort, searchQuery, filterValues, addToast]);

  useEffect(() => {
    fetchUserActivity();
  }, [fetchUserActivity]);

  // Column definitions
  // Requirements: 12.1 - Display columns: User Email, Tool Name, Is Shortcut, Created Date
  const columns: Column<UserActivityItem>[] = [
    {
      key: 'user_email',
      label: 'User Email',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gray-900">{String(value)}</span>
      ),
    },
    {
      key: 'tool_name',
      label: 'Tool Name',
      sortable: true,
      render: (value) => (
        <span className="text-gray-700">{value ? String(value) : 'Unknown Tool'}</span>
      ),
    },
    {
      key: 'is_shortcut',
      label: 'Type',
      sortable: true,
      render: (value) => <ShortcutBadge isShortcut={Boolean(value)} />,
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
  // Requirements: 12.3 - Filter by is_shortcut
  const filters: Filter[] = [
    {
      key: 'is_shortcut',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'true', label: 'Shortcuts Only' },
        { value: 'false', label: 'Favorites Only' },
      ],
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilter = (newFilters: Record<string, unknown>) => {
    setFilterValues(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">User Activity</h2>
        <p className="text-gray-500 mt-1">
          View user favorites and shortcuts (read-only)
        </p>
      </div>

      {/* Aggregate Statistics - Requirements: 12.5 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Favorites"
          value={stats.totalFavorites.toLocaleString()}
          icon={Heart}
          color="blue"
        />
        <StatsCard
          title="Total Shortcuts"
          value={stats.totalShortcuts.toLocaleString()}
          icon={Bookmark}
          color="green"
        />
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-gray-700">Top 5 Most Favorited Tools</p>
          </div>
          <TopFavoritedTools tools={stats.topFavoritedTools} />
        </div>
      </div>

      {/* Data Table - Requirements: 12.1, 12.2, 12.3, 12.4 */}
      <DataTable
        data={favorites}
        columns={columns}
        filters={filters}
        // No row actions - read-only (Requirements: 12.2)
        rowActions={[]}
        // No bulk actions - read-only (Requirements: 12.2)
        bulkActions={[]}
        pagination={pagination}
        sort={sort}
        filterValues={filterValues}
        searchQuery={searchQuery}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSort={handleSort}
        onSearch={handleSearch}
        onFilter={handleFilter}
        isLoading={isLoading}
        emptyMessage="No user favorites found."
        enableSelection={false}
        getRowId={(row) => row.id}
      />
    </div>
  );
}
