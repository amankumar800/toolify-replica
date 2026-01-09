'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/admin/Toast';
import { DeleteModal } from '@/components/admin/DeleteModal';
import { createLogger } from '@/lib/logger';

const log = createLogger('AdminCategoriesPage');
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Folder,
  FolderTree,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface CategoryGroup {
  id: string;
  name: string;
  icon_name: string | null;
  display_order: number | null;
}

interface CategoryListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  group_id: string | null;
  display_order: number | null;
  created_at: string | null;
  group: CategoryGroup | null;
  computed_tool_count: number;
}

interface AffectedRecords {
  subcategories: Array<{ id: string; name: string; slug: string }>;
  tools: Array<{ id: string; name: string }>;
  tool_categories_count: number;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Categories List Page
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 * - Display columns: Name, Slug, Group Name, Tool Count, Display Order, Created Date
 * - Filter by group_id
 * - Drag-drop reordering within group
 * - Row actions: Edit, Delete
 */
export default function CategoriesPage() {
  const router = useRouter();
  const { addToast } = useToast();

  // State
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    category: CategoryListItem | null;
    affectedRecords: AffectedRecords | null;
  }>({ isOpen: false, category: null, affectedRecords: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Fetch category groups for filter
  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/category-groups');
      if (response.ok) {
        const data = await response.json();
        setCategoryGroups(data.data || []);
      }
    } catch (error) {
      log.error('Error fetching category groups', error, { action: 'fetchGroups' });
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = selectedGroupId
        ? `/api/admin/categories?group_id=${selectedGroupId}`
        : '/api/admin/categories';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data.data);
    } catch (error) {
      log.error('Error fetching categories', error, { action: 'fetchCategories' });
      addToast({
        variant: 'error',
        message: 'Failed to load categories. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast, selectedGroupId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle delete click - fetch affected records first
  const handleDeleteClick = async (category: CategoryListItem) => {
    try {
      const response = await fetch(`/api/admin/categories/${category.id}/affected`);
      if (response.ok) {
        const data = await response.json();
        setDeleteModal({
          isOpen: true,
          category,
          affectedRecords: data.affected,
        });
      } else {
        // If we can't get affected records, still show the modal
        setDeleteModal({
          isOpen: true,
          category,
          affectedRecords: null,
        });
      }
    } catch (error) {
      log.error('Error fetching affected records', error, { action: 'fetchAffectedRecords' });
      setDeleteModal({
        isOpen: true,
        category,
        affectedRecords: null,
      });
    }
  };

  // Handle delete confirmation
  const handleDelete = async () => {
    if (!deleteModal.category) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/categories/${deleteModal.category.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete category');
      }

      const result = await response.json();
      
      addToast({
        variant: 'success',
        message: `Category deleted successfully. ${result.deleted.subcategories} subcategories and ${result.deleted.tool_categories} tool associations removed.`,
      });

      setDeleteModal({ isOpen: false, category: null, affectedRecords: null });
      fetchCategories();
    } catch (error) {
      log.error('Error deleting category', error, { action: 'deleteCategory' });
      addToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete category',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Drag and drop handlers
  // Requirements: 5.3 - Drag-drop reordering within group
  const handleDragStart = (index: number) => {
    setIsDragging(true);
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Only allow reordering within the same group
    const draggedCategory = categories[draggedIndex];
    const targetCategory = categories[index];
    
    if (draggedCategory.group_id !== targetCategory.group_id) {
      return; // Don't allow dragging between groups
    }

    // Reorder the list
    const newCategories = [...categories];
    const draggedItem = newCategories[draggedIndex];
    newCategories.splice(draggedIndex, 1);
    newCategories.splice(index, 0, draggedItem);
    
    setCategories(newCategories);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    setIsDragging(false);
    setDraggedIndex(null);

    // Save new order to server
    const orders = categories.map((category, index) => ({
      id: category.id,
      display_order: index + 1,
    }));

    try {
      const response = await fetch('/api/admin/categories/reorder', {
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
      fetchCategories();
    } catch (error) {
      log.error('Error saving order', error, { action: 'reorderCategories' });
      addToast({
        variant: 'error',
        message: 'Failed to save order. Please try again.',
      });
      // Refresh to restore original order
      fetchCategories();
    }
  };

  // Build affected records for delete modal
  const buildAffectedRecords = () => {
    if (!deleteModal.affectedRecords) return undefined;
    
    const records = [];
    
    if (deleteModal.affectedRecords.subcategories.length > 0) {
      records.push({
        type: 'Subcategories',
        count: deleteModal.affectedRecords.subcategories.length,
        items: deleteModal.affectedRecords.subcategories.map((s) => s.name),
      });
    }
    
    if (deleteModal.affectedRecords.tools.length > 0) {
      records.push({
        type: 'Tool Associations',
        count: deleteModal.affectedRecords.tools.length,
        items: deleteModal.affectedRecords.tools.slice(0, 5).map((t) => t.name),
      });
    }
    
    return records.length > 0 ? records : undefined;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Categories</h2>
          <p className="text-gray-500 mt-1">
            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} total
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/categories/new">
            <Plus className="w-4 h-4 mr-2" /> Add Category
          </Link>
        </Button>
      </div>

      {/* Filter by Group */}
      <div className="flex items-center gap-4">
        <label htmlFor="group-filter" className="text-sm font-medium text-gray-700">
          Filter by Group:
        </label>
        <select
          id="group-filter"
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Groups</option>
          <option value="none">No Group</option>
          {categoryGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {/* Drag-drop hint */}
      <p className="text-sm text-gray-500">
        Drag and drop rows to reorder categories within the same group.
      </p>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Group
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tools
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                  Created
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
                      <div className="h-4 bg-gray-200 rounded w-32" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded w-24" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded w-20" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded w-8" />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="h-4 bg-gray-200 rounded w-8" />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="h-4 bg-gray-200 rounded w-20" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded w-16" />
                    </td>
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <Folder className="w-8 h-8 text-gray-300" />
                      <p className="text-sm">
                        {selectedGroupId
                          ? 'No categories found in this group.'
                          : 'No categories found. Create your first category to get started.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((category, index) => (
                  <tr
                    key={category.id}
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                        {category.slug}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      {category.group ? (
                        <div className="flex items-center gap-1.5">
                          <FolderTree className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-700">{category.group.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                        {category.computed_tool_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-600">
                        {category.display_order ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">
                        {category.created_at
                          ? new Date(category.created_at).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/categories/${category.id}/edit`)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(category)}
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
        onClose={() => setDeleteModal({ isOpen: false, category: null, affectedRecords: null })}
        onConfirm={handleDelete}
        title="Delete Category"
        recordName={deleteModal.category?.name ?? ''}
        affectedRecords={buildAffectedRecords()}
        requireConfirmation={
          (deleteModal.affectedRecords?.subcategories.length ?? 0) > 0 ||
          (deleteModal.affectedRecords?.tools.length ?? 0) > 0
        }
        isLoading={isDeleting}
      />
    </div>
  );
}
