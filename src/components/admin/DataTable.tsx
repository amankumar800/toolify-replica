'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  MoreHorizontal,
  Check,
  X,
  Loader2,
} from 'lucide-react';

// ============================================
// Types
// ============================================

/**
 * Column definition for the DataTable
 */
export interface Column<T> {
  /** Unique key for the column, can be a key of T or a custom string */
  key: keyof T | string;
  /** Display label for the column header */
  label: string;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Custom cell renderer */
  render?: (value: unknown, row: T) => React.ReactNode;
  /** Column width (CSS value) */
  width?: string;
  /** Whether to hide this column on mobile */
  hideOnMobile?: boolean;
}

/**
 * Filter definition for column-specific filters
 */
export interface Filter {
  /** Unique key for the filter */
  key: string;
  /** Display label for the filter */
  label: string;
  /** Type of filter control */
  type: 'select' | 'text' | 'date-range';
  /** Options for select filters */
  options?: { value: string; label: string }[];
}

/**
 * Row action definition
 */
export interface RowAction<T> {
  /** Display label for the action */
  label: string;
  /** Icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Click handler */
  onClick: (row: T) => void;
  /** Visual variant */
  variant?: 'default' | 'destructive';
  /** Condition to show/hide the action */
  condition?: (row: T) => boolean;
}

/**
 * Bulk action definition
 */
export interface BulkAction {
  /** Display label for the action */
  label: string;
  /** Icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Click handler with selected IDs */
  onClick: (selectedIds: string[]) => void;
  /** Visual variant */
  variant?: 'default' | 'destructive';
  /** Confirmation message for destructive actions */
  confirmMessage?: string;
}


/**
 * Pagination configuration
 */
export interface PaginationConfig {
  /** Current page (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  total: number;
}

/**
 * Sort configuration
 */
export interface SortConfig {
  /** Column key to sort by */
  key: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * DataTable component props
 */
export interface DataTableProps<T extends { id: string }> {
  /** Data to display */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Filter definitions */
  filters?: Filter[];
  /** Row action definitions */
  rowActions?: RowAction<T>[];
  /** Bulk action definitions */
  bulkActions?: BulkAction[];
  /** Pagination configuration */
  pagination: PaginationConfig;
  /** Current sort configuration */
  sort?: SortConfig;
  /** Current filter values */
  filterValues?: Record<string, unknown>;
  /** Current search query */
  searchQuery?: string;
  /** Page change handler */
  onPageChange: (page: number) => void;
  /** Page size change handler */
  onPageSizeChange: (size: number) => void;
  /** Sort change handler */
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  /** Filter change handler */
  onFilter?: (filters: Record<string, unknown>) => void;
  /** Search change handler */
  onSearch?: (query: string) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Enable row selection */
  enableSelection?: boolean;
  /** Export handler */
  onExport?: () => void;
  /** ID accessor for rows (defaults to 'id') */
  getRowId?: (row: T) => string;
  /** Custom row class name function */
  getRowClassName?: (row: T) => string;
}

// ============================================
// Constants
// ============================================

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const SEARCH_DEBOUNCE_MS = 300;

// ============================================
// Helper Components
// ============================================

/**
 * Loading skeleton for table rows
 */
function TableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="animate-pulse">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * Empty state component
 */
function EmptyState({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={100} className="px-4 py-12 text-center">
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <Search className="w-8 h-8 text-gray-300" />
          <p className="text-sm">{message}</p>
        </div>
      </td>
    </tr>
  );
}

/**
 * Sort indicator component
 */
function SortIndicator({ direction }: { direction?: 'asc' | 'desc' }) {
  if (!direction) {
    return (
      <span className="ml-1 text-gray-300">
        <ChevronUp className="w-3 h-3 -mb-1" />
        <ChevronDown className="w-3 h-3 -mt-1" />
      </span>
    );
  }
  return direction === 'asc' ? (
    <ChevronUp className="w-4 h-4 ml-1 text-blue-600" />
  ) : (
    <ChevronDown className="w-4 h-4 ml-1 text-blue-600" />
  );
}


/**
 * Row actions dropdown component
 */
function RowActionsDropdown<T extends { id: string }>({
  row,
  actions,
}: {
  row: T;
  actions: RowAction<T>[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter actions based on conditions
  const visibleActions = actions.filter(
    (action) => !action.condition || action.condition(row)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (visibleActions.length === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors touch-target"
        aria-label="Row actions"
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-20 min-w-[160px] bg-white rounded-lg shadow-lg border border-gray-200 py-1">
          {visibleActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  action.onClick(row);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors',
                  action.variant === 'destructive' && 'text-red-600 hover:bg-red-50'
                )}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Bulk actions bar component
 */
function BulkActionsBar({
  selectedCount,
  actions,
  onClearSelection,
}: {
  selectedCount: number;
  actions: BulkAction[];
  onClearSelection: () => void;
}) {
  const [confirmingAction, setConfirmingAction] = useState<number | null>(null);

  const handleActionClick = (action: BulkAction, index: number, selectedIds: string[]) => {
    if (action.confirmMessage && confirmingAction !== index) {
      setConfirmingAction(index);
      return;
    }
    action.onClick(selectedIds);
    setConfirmingAction(null);
  };

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-blue-50 border-b border-blue-100">
      <span className="text-sm font-medium text-blue-700">
        {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
      </span>
      <div className="flex items-center gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const isConfirming = confirmingAction === index;
          
          return (
            <Button
              key={index}
              variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => handleActionClick(action, index, [])} // selectedIds passed from parent
              className={cn(isConfirming && 'ring-2 ring-red-300')}
            >
              {Icon && <Icon className="w-4 h-4 mr-1" />}
              {isConfirming ? 'Confirm?' : action.label}
            </Button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => {
          onClearSelection();
          setConfirmingAction(null);
        }}
        className="ml-auto text-sm text-blue-600 hover:text-blue-800"
      >
        Clear selection
      </button>
    </div>
  );
}


/**
 * Filter bar component
 */
function FilterBar({
  filters,
  values,
  onChange,
}: {
  filters: Filter[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {filters.map((filter) => {
        if (filter.type === 'select' && filter.options) {
          return (
            <div key={filter.key} className="flex items-center gap-2">
              <label className="text-sm text-gray-600">{filter.label}:</label>
              <select
                value={(values[filter.key] as string) || ''}
                onChange={(e) => onChange(filter.key, e.target.value || undefined)}
                className="h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                <option value="">All</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

/**
 * Pagination controls component
 */
function PaginationControls({
  pagination,
  onPageChange,
  onPageSizeChange,
}: {
  pagination: PaginationConfig;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const { page, pageSize, total } = pagination;
  const totalPages = Math.ceil(total / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-gray-200">
      {/* Page size selector */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Show</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-8 px-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span>per page</span>
      </div>

      {/* Item count display */}
      <div className="text-sm text-gray-600">
        {total > 0 ? (
          <>
            Showing {startItem} to {endItem} of {total} items
          </>
        ) : (
          'No items'
        )}
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-target"
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-target"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-2">
          {generatePageNumbers(page, totalPages).map((pageNum, index) => (
            pageNum === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-400">...</span>
            ) : (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum as number)}
                className={cn(
                  'min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors',
                  page === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                )}
              >
                {pageNum}
              </button>
            )
          ))}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || totalPages === 0}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-target"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages || totalPages === 0}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-target"
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Generate page numbers with ellipsis for large page counts
 */
function generatePageNumbers(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];
  
  // Always show first page
  pages.push(1);
  
  if (currentPage > 3) {
    pages.push('...');
  }
  
  // Show pages around current page
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  
  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }
  
  if (currentPage < totalPages - 2) {
    pages.push('...');
  }
  
  // Always show last page
  if (!pages.includes(totalPages)) {
    pages.push(totalPages);
  }
  
  return pages;
}


// ============================================
// Main DataTable Component
// ============================================

/**
 * DataTable Component
 * 
 * A comprehensive data table component for admin CRUD operations.
 * 
 * Features:
 * - Column rendering with custom cell renderers
 * - Loading skeleton and empty state
 * - Pagination with configurable page sizes (10, 20, 50)
 * - Sortable columns with ascending/descending toggle
 * - Global search with debounce
 * - Column-specific filters
 * - Row selection with bulk actions
 * - Row actions dropdown
 * - Responsive design (horizontally scrollable on mobile)
 * 
 * Requirements:
 * - 3.2: Pagination with 20 items per page
 * - 3.3: Sorting by columns
 * - 3.4: Search functionality
 * - 3.5: Filtering by columns
 * - 3.6: Row actions (Edit, Delete)
 * - 3.7: Bulk selection and actions
 * - 7.3: Sorting for news
 * - 7.4: Bulk actions for news
 * - 13.1: DataTable component features
 * - 13.4: Bulk actions component
 * - 22.2: Horizontally scrollable on mobile
 * - 22.4: Action buttons via dropdown on mobile
 */
export function DataTable<T extends { id: string }>({
  data,
  columns,
  filters = [],
  rowActions = [],
  bulkActions = [],
  pagination,
  sort,
  filterValues = {},
  searchQuery = '',
  onPageChange,
  onPageSizeChange,
  onSort,
  onFilter,
  onSearch,
  isLoading = false,
  emptyMessage = 'No items found',
  enableSelection = false,
  onExport,
  getRowId = (row) => row.id,
  getRowClassName,
}: DataTableProps<T>) {
  // ============================================
  // State
  // ============================================
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [localFilterValues, setLocalFilterValues] = useState(filterValues);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Track previous values to avoid unnecessary updates
  const prevSearchQueryRef = useRef(searchQuery);
  const prevFilterValuesRef = useRef(filterValues);

  // Sync local state with props only when they actually change
  useEffect(() => {
    if (prevSearchQueryRef.current !== searchQuery) {
      setLocalSearchQuery(searchQuery);
      prevSearchQueryRef.current = searchQuery;
    }
  }, [searchQuery]);

  useEffect(() => {
    // Compare by JSON string to handle object reference changes
    const prevJson = JSON.stringify(prevFilterValuesRef.current);
    const currentJson = JSON.stringify(filterValues);
    if (prevJson !== currentJson) {
      setLocalFilterValues(filterValues);
      prevFilterValuesRef.current = filterValues;
    }
  }, [filterValues]);

  // ============================================
  // Handlers
  // ============================================

  // Handle search with debounce
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      onSearch?.(value);
    }, SEARCH_DEBOUNCE_MS);
  }, [onSearch]);

  // Handle filter change
  const handleFilterChange = useCallback((key: string, value: unknown) => {
    const newFilters = { ...localFilterValues, [key]: value };
    if (value === undefined || value === '') {
      delete newFilters[key];
    }
    setLocalFilterValues(newFilters);
    onFilter?.(newFilters);
  }, [localFilterValues, onFilter]);

  // Handle sort
  const handleSort = useCallback((key: string) => {
    if (!onSort) return;
    
    const newDirection: 'asc' | 'desc' = 
      sort?.key === key && sort.direction === 'asc' ? 'desc' : 'asc';
    onSort(key, newDirection);
  }, [sort, onSort]);

  // Handle row selection
  const handleSelectRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(getRowId)));
    }
  }, [data, selectedIds.size, getRowId]);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Get cell value
  const getCellValue = useCallback((row: T, key: keyof T | string): unknown => {
    if (typeof key === 'string' && key.includes('.')) {
      // Handle nested keys like 'user.name'
      return key.split('.').reduce((obj: unknown, k) => {
        if (obj && typeof obj === 'object') {
          return (obj as Record<string, unknown>)[k];
        }
        return undefined;
      }, row);
    }
    return row[key as keyof T];
  }, []);

  // ============================================
  // Computed values
  // ============================================

  const isAllSelected = data.length > 0 && selectedIds.size === data.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < data.length;
  const hasSelection = enableSelection && bulkActions.length > 0;
  const columnCount = columns.length + (hasSelection ? 1 : 0) + (rowActions.length > 0 ? 1 : 0);

  // ============================================
  // Render
  // ============================================

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-gray-200">
        {/* Search */}
        {onSearch && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search..."
              value={localSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* Filters */}
        {filters.length > 0 && onFilter && (
          <FilterBar
            filters={filters}
            values={localFilterValues}
            onChange={handleFilterChange}
          />
        )}

        {/* Export button */}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport} className="ml-auto">
            Export CSV
          </Button>
        )}
      </div>

      {/* Bulk actions bar */}
      {hasSelection && selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          actions={bulkActions.map((action) => ({
            ...action,
            onClick: () => action.onClick(Array.from(selectedIds)),
          }))}
          onClearSelection={handleClearSelection}
        />
      )}

      {/* Table container - horizontally scrollable on mobile (Requirement 22.2) */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          {/* Table header */}
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {/* Selection checkbox column */}
              {hasSelection && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    aria-label="Select all rows"
                  />
                </th>
              )}

              {/* Data columns */}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider',
                    column.sortable && 'cursor-pointer select-none hover:bg-gray-100',
                    column.hideOnMobile && 'hidden md:table-cell'
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="flex items-center">
                    {column.label}
                    {column.sortable && (
                      <SortIndicator
                        direction={sort?.key === String(column.key) ? sort.direction : undefined}
                      />
                    )}
                  </div>
                </th>
              ))}

              {/* Actions column */}
              {rowActions.length > 0 && (
                <th className="w-12 px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>

          {/* Table body */}
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <TableSkeleton columns={columnCount} />
            ) : data.length === 0 ? (
              <EmptyState message={emptyMessage} />
            ) : (
              data.map((row) => {
                const rowId = getRowId(row);
                const isSelected = selectedIds.has(rowId);
                const customRowClass = getRowClassName?.(row);

                return (
                  <tr
                    key={rowId}
                    className={cn(
                      'hover:bg-gray-50 transition-colors',
                      isSelected && 'bg-blue-50',
                      customRowClass
                    )}
                  >
                    {/* Selection checkbox */}
                    {hasSelection && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(rowId)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          aria-label={`Select row ${rowId}`}
                        />
                      </td>
                    )}

                    {/* Data cells */}
                    {columns.map((column) => {
                      const value = getCellValue(row, column.key);
                      return (
                        <td
                          key={String(column.key)}
                          className={cn(
                            'px-4 py-3 text-sm text-gray-900',
                            column.hideOnMobile && 'hidden md:table-cell'
                          )}
                        >
                          {column.render ? column.render(value, row) : String(value ?? '')}
                        </td>
                      );
                    })}

                    {/* Row actions */}
                    {rowActions.length > 0 && (
                      <td className="px-4 py-3">
                        <RowActionsDropdown row={row} actions={rowActions} />
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <PaginationControls
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}

// All types are already exported at their definition
