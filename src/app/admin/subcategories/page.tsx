'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/admin/Toast';
import { DeleteModal } from '@/components/admin/DeleteModal';
import { createLogger } from '@/lib/logger';

const log = createLogger('AdminSubcategoriesPage');
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  FolderOpen,
  Folder,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SubcategoryListItem {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  tool_count: number | null;
  display_order: number | null;
  created_at: string | null;
  category: Category | null;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Subcategories List Page
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 * - Display columns: Name, Slug, Parent Category, Tool Count, Display Order
 * - Filter by category_id
 * - Drag-drop reordering within parent
 * - Row actions: Edit, Delete
 */
export default function SubcategoriesPage() {
  const router = useRouter();
  const { addToast } = useToast();

  // State
  const [subcategories, setSubcategories] = useState<SubcategoryListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    subcategory: SubcategoryListItem | null;
  }>({ isOpen: false, subcategory: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Fetch categories for filter
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      log.error('Error fetching categories', error, { action: 'fetchCategories' });
    }
  }, []);

  // Fetch subcategories
  const fetchSubcategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = selectedCategoryId
        ? `/api/admin/subcategories?category_id=${selectedCategoryId}`
        : '/api/admin/subcategories';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch subcategories');
      }

      const data = await response.json();
      setSubcategories(data.data);
    } catch (error) {
      log.error('Error fetching subcategories', error, { action: 'fetchSubcategories' });
      addToast({
        variant: 'error',
        message: 'Failed to load subcategories. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast, selectedCategoryId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchSubcategories();
  }, [fetchSubcategories]);

  // Handle delete click
  const handleDeleteClick = (subcategory: SubcategoryListItem) => {
    setDeleteModal({
      isOpen: true,
      subcategory,
    });
  };

  // Handle delete confirmation
  const handleDelete = async () => {
    if (!deleteModal.subcategory) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/subcategories/${deleteModal.subcategory.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete subcategory');
      }
      
      addToast({
        variant: 'success',
        message: 'Subcategory deleted successfully.',
      });

      setDeleteModal({ isOpen: false, subcategory: null });
      fetchSubcategories();
    } catch (error) {
      log.error('Error deleting subcategory', error, { action: 'deleteSubcategory' });
      addToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete subcategory',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Drag and drop handlers
  // Requirements: 6.3 - Drag-drop reordering within parent category
  const handleDragStart = (index: number) => {
    setIsDragging(true);
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Only allow reordering within the same parent category
    const draggedSubcategory = subcategories[draggedIndex];
    const targetSubcategory = subcategories[index];
    
    if (draggedSubcategory.category_id !== targetSubcategory.category_id) {
      return; // Don't allow dragging between parent categories
    }

    // Reorder the list
    const newSubcategories = [...subcategories];
    const draggedItem = newSubcategories[draggedIndex];
    newSubcategories.splice(draggedIndex, 1);
    newSubcategories.splice(index, 0, draggedItem);
    
    setSubcategories(newSubcategories);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    setIsDragging(false);
    setDraggedIndex(null);

    // Save new order to server
    const orders = subcategories.map((subcategory, index) => ({
      id: subcategory.id,
      display_order: index + 1,
    }));

    try {
      const response = await fetch('/api/admin/subcategories/reorder', {
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
      fetchSubcategories();
    } catch (error) {
      log.error('Error saving order', error, { action: 'reorderSubcategories' });
      addToast({
        variant: 'error',
        message: 'Failed to save order. Please try again.',
      });
      // Refresh to restore original order
      fetchSubcategories();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Subcategories</h2>
          <p className="text-gray-500 mt-1">
            {subcategories.length} subcategor{subcategories.length !== 1 ? 'ies' : 'y'} total
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/subcategories/new">
            <Plus className="w-4 h-4 mr-2" /> Add Subcategory
          </Link>
        </Button>
      </div>

      {/* Filter by Category */}
      <div className="flex items-center gap-4">
        <label htmlFor="category-filter" className="text-sm font-medium text-gray-700">
          Filter by Category:
        </label>
        <select
          id="category-filter"
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Drag-drop hint */}
      <p className="text-sm text-gray-500">
        Drag and drop rows to reorder subcategories within the same parent category.
      </p>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
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
                  Parent Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tools
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
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded w-16" />
                    </td>
                  </tr>
                ))
              ) : subcategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <FolderOpen className="w-8 h-8 text-gray-300" />
                      <p className="text-sm">
                        {selectedCategoryId
                          ? 'No subcategories found in this category.'
                          : 'No subcategories found. Create your first subcategory to get started.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                subcategories.map((subcategory, index) => (
                  <tr
                    key={subcategory.id}
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
                        <FolderOpen className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{subcategory.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                        {subcategory.slug}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      {subcategory.category ? (
                        <div className="flex items-center gap-1.5">
                          <Folder className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-700">{subcategory.category.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                        {subcategory.tool_count ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-600">
                        {subcategory.display_order ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/subcategories/${subcategory.id}/edit`)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(subcategory)}
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
        onClose={() => setDeleteModal({ isOpen: false, subcategory: null })}
        onConfirm={handleDelete}
        title="Delete Subcategory"
        recordName={deleteModal.subcategory?.name ?? ''}
        isLoading={isDeleting}
      />
    </div>
  );
}
