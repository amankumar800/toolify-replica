'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DataTable, type Column, type RowAction, type SortConfig } from '@/components/admin/DataTable';
import { useToast } from '@/components/admin/Toast';
import { DeleteModal } from '@/components/admin/DeleteModal';
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  FolderTree,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface CategoryGroupListItem {
  id: string;
  name: string;
  icon_name: string | null;
  display_order: number | null;
  category_count: number;
  created_at: string | null;
}

interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
}

// ============================================================================
// Main Component
// ============================================================================

export default function CategoryGroupsPage() {
  const router = useRouter();
  const { addToast } = useToast();

  // State
  const [groups, setGroups] = useState<CategoryGroupListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    group: CategoryGroupListItem | null;
    affectedCategories: CategoryInfo[];
  }>({ isOpen: false, group: null, affectedCategories: [] });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Fetch category groups
  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/category-groups');
      if (!response.ok) {
        throw new Error('Failed to fetch category groups');
      }

      const data = await response.json();
      setGroups(data.data);
    } catch (error) {
      console.error('Error fetching category groups:', error);
      addToast({
        variant: 'error',
        message: 'Failed to load category groups. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Column definitions
  // Requirements: 4.1 - Display columns: Name, Icon, Display Order, Category Count, Created Date
  const columns: Column<CategoryGroupListItem>[] = [
    {
      key: 'drag',
      label: '',
      width: '40px',
      render: () => (
        <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
          <GripVertical className="w-4 h-4" />
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-900">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'icon_name',
      label: 'Icon',
      sortable: false,
      render: (value) => (
        value ? (
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{String(value)}</code>
        ) : (
          <span className="text-gray-400">—</span>
        )
      ),
    },
    {
      key: 'display_order',
      label: 'Order',
      sortable: false,
      render: (value) => (
        <span className="text-gray-600">{value != null ? String(value) : '—'}</span>
      ),
    },
    {
      key: 'category_count',
      label: 'Categories',
      sortable: false,
      render: (value) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
          {String(value ?? 0)}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: false,
      hideOnMobile: true,
      render: (value) => {
        if (!value) return 'N/A';
        return new Date(value as string).toLocaleDateString();
      },
    },
  ];

  // Row actions
  // Requirements: 4.3 - Row actions: Edit, Delete
  const rowActions: RowAction<CategoryGroupListItem>[] = [
    {
      label: 'Edit',
      icon: Pencil,
      onClick: (row) => router.push(`/admin/category-groups/${row.id}/edit`),
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (row) => handleDeleteClick(row),
    },
  ];

  // Handlers
  const handleDeleteClick = async (group: CategoryGroupListItem) => {
    // Check if group has categories
    if (group.category_count > 0) {
      try {
        const response = await fetch(`/api/admin/category-groups/${group.id}`);
        if (response.ok) {
          // Fetch categories in this group
          const categoriesResponse = await fetch(`/api/admin/category-groups/${group.id}`);
          const groupData = await categoriesResponse.json();
          
          // Get categories from the canDelete check
          const deleteCheckResponse = await fetch(`/api/admin/category-groups/${group.id}`, {
            method: 'DELETE',
          });
          
          if (!deleteCheckResponse.ok) {
            const errorData = await deleteCheckResponse.json();
            if (errorData.categories) {
              setDeleteModal({
                isOpen: true,
                group,
                affectedCategories: errorData.categories,
              });
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error checking categories:', error);
      }
    }
    
    setDeleteModal({
      isOpen: true,
      group,
      affectedCategories: [],
    });
  };

  const handleDelete = async () => {
    if (!deleteModal.group) return;

    // Prevent deletion if there are affected categories
    if (deleteModal.affectedCategories.length > 0) {
      addToast({
        variant: 'error',
        message: 'Cannot delete group with assigned categories. Please reassign or delete the categories first.',
      });
      setDeleteModal({ isOpen: false, group: null, affectedCategories: [] });
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/category-groups/${deleteModal.group.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete category group');
      }

      addToast({
        variant: 'success',
        message: 'Category group deleted successfully',
      });

      setDeleteModal({ isOpen: false, group: null, affectedCategories: [] });
      fetchGroups();
    } catch (error) {
      console.error('Error deleting category group:', error);
      addToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete category group',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Drag and drop handlers
  // Requirements: 4.2 - Drag-drop reordering
  const handleDragStart = (index: number) => {
    setIsDragging(true);
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Reorder the list
    const newGroups = [...groups];
    const draggedItem = newGroups[draggedIndex];
    newGroups.splice(draggedIndex, 1);
    newGroups.splice(index, 0, draggedItem);
    
    setGroups(newGroups);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    setIsDragging(false);
    setDraggedIndex(null);

    // Save new order to server
    const orders = groups.map((group, index) => ({
      id: group.id,
      display_order: index + 1,
    }));

    try {
      const response = await fetch('/api/admin/category-groups/reorder', {
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
      fetchGroups();
    } catch (error) {
      console.error('Error saving order:', error);
      addToast({
        variant: 'error',
        message: 'Failed to save order. Please try again.',
      });
      // Refresh to restore original order
      fetchGroups();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Category Groups</h2>
          <p className="text-gray-500 mt-1">
            {groups.length} group{groups.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/category-groups/new">
            <Plus className="w-4 h-4 mr-2" /> Add Group
          </Link>
        </Button>
      </div>

      {/* Drag-drop hint */}
      <p className="text-sm text-gray-500">
        Drag and drop rows to reorder category groups.
      </p>

      {/* Data Table with drag-drop support */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${
                      column.hideOnMobile ? 'hidden md:table-cell' : ''
                    }`}
                    style={{ width: column.width }}
                  >
                    {column.label}
                  </th>
                ))}
                <th className="w-12 px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    {columns.map((_, colIndex) => (
                      <td key={colIndex} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded w-8" />
                    </td>
                  </tr>
                ))
              ) : groups.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <FolderTree className="w-8 h-8 text-gray-300" />
                      <p className="text-sm">No category groups found. Create your first group to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                groups.map((group, index) => (
                  <tr
                    key={group.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`hover:bg-gray-50 transition-colors ${
                      isDragging && draggedIndex === index ? 'opacity-50 bg-blue-50' : ''
                    }`}
                  >
                    {columns.map((column) => {
                      const value = group[column.key as keyof CategoryGroupListItem];
                      return (
                        <td
                          key={String(column.key)}
                          className={`px-4 py-3 text-sm text-gray-900 ${
                            column.hideOnMobile ? 'hidden md:table-cell' : ''
                          }`}
                        >
                          {column.render ? column.render(value, group) : String(value ?? '')}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {rowActions.map((action, actionIndex) => {
                          const Icon = action.icon;
                          return (
                            <button
                              key={actionIndex}
                              type="button"
                              onClick={() => action.onClick(group)}
                              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                                action.variant === 'destructive' ? 'text-red-600 hover:bg-red-50' : 'text-gray-600'
                              }`}
                              title={action.label}
                            >
                              {Icon && <Icon className="w-4 h-4" />}
                            </button>
                          );
                        })}
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
        onClose={() => setDeleteModal({ isOpen: false, group: null, affectedCategories: [] })}
        onConfirm={handleDelete}
        title="Delete Category Group"
        recordName={deleteModal.group?.name ?? ''}
        affectedRecords={
          deleteModal.affectedCategories.length > 0
            ? [
                {
                  type: 'Categories',
                  count: deleteModal.affectedCategories.length,
                  items: deleteModal.affectedCategories.map((c) => c.name),
                },
              ]
            : undefined
        }
        isLoading={isDeleting}
      />
    </div>
  );
}
