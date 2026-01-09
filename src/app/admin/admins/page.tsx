'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DataTable, type Column, type RowAction, type SortConfig } from '@/components/admin/DataTable';
import { useToast } from '@/components/admin/Toast';
import { DeleteModal } from '@/components/admin/DeleteModal';
import { createLogger } from '@/lib/logger';

const log = createLogger('AdminAdminsPage');
import {
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  Unlock,
} from 'lucide-react';
import type { AdminStatus } from '@/lib/services/admin-crud.types';

// ============================================================================
// Types
// ============================================================================

interface AdminListItem {
  id: string;
  email: string;
  status: AdminStatus;
  is_active: boolean;
  last_login_at: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
  created_at: string | null;
}

interface AdminsListResponse {
  data: AdminListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Status badge component
 * Requirements: 11.2
 * Property 18: Admin Status Badge
 * - Green for active (is_active=true, not locked)
 * - Gray for inactive (is_active=false)
 * - Red for locked (locked_until > now)
 */
function StatusBadge({ status }: { status: AdminStatus }) {
  const statusConfig: Record<AdminStatus, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Inactive' },
    locked: { bg: 'bg-red-100', text: 'text-red-700', label: 'Locked' },
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function AdminsPage() {
  const router = useRouter();
  const { addToast } = useToast();

  // State
  const [admins, setAdmins] = useState<AdminListItem[]>([]);
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
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    admin: AdminListItem | null;
  }>({ isOpen: false, admin: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    isOpen: boolean;
    admin: AdminListItem | null;
    newPassword: string | null;
  }>({ isOpen: false, admin: null, newPassword: null });
  const [isResetting, setIsResetting] = useState(false);

  // Fetch admins
  const fetchAdmins = useCallback(async () => {
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

      const response = await fetch(`/api/admin/admins?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }

      const data: AdminsListResponse = await response.json();
      setAdmins(data.data);
      setPagination(data.pagination);
    } catch (error) {
      log.error('Error fetching admins', error, { action: 'fetchAdmins' });
      addToast({
        variant: 'error',
        message: 'Failed to load admins. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.pageSize, sort, searchQuery, addToast]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Column definitions
  // Requirements: 11.1 - Display columns: Email, Status, Last Login, Failed Attempts, Created Date
  const columns: Column<AdminListItem>[] = [
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gray-900">{String(value)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      render: (value) => <StatusBadge status={value as AdminStatus} />,
    },
    {
      key: 'last_login_at',
      label: 'Last Login',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-gray-400">Never</span>;
        return new Date(value as string).toLocaleString();
      },
    },
    {
      key: 'failed_login_attempts',
      label: 'Failed Attempts',
      sortable: true,
      render: (value) => {
        const attempts = value as number;
        if (attempts === 0) return <span className="text-gray-400">0</span>;
        return (
          <span className={attempts >= 3 ? 'text-red-600 font-medium' : 'text-gray-600'}>
            {attempts}
          </span>
        );
      },
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

  // Row actions
  // Requirements: 11.3 - Row actions: Edit, Reset Password, Unlock (if locked), Delete
  const rowActions: RowAction<AdminListItem>[] = [
    {
      label: 'Edit',
      icon: Pencil,
      onClick: (row) => router.push(`/admin/admins/${row.id}/edit`),
    },
    {
      label: 'Reset Password',
      icon: KeyRound,
      onClick: (row) => handleResetPassword(row),
    },
    {
      label: 'Unlock',
      icon: Unlock,
      onClick: (row) => handleUnlock(row.id),
      condition: (row) => row.status === 'locked',
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (row) => setDeleteModal({ isOpen: true, admin: row }),
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

  const handleDelete = async () => {
    if (!deleteModal.admin) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/admins/${deleteModal.admin.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete admin');
      }

      addToast({
        variant: 'success',
        message: 'Admin deleted successfully',
      });

      setDeleteModal({ isOpen: false, admin: null });
      fetchAdmins();
    } catch (error) {
      log.error('Error deleting admin', error, { action: 'deleteAdmin' });
      addToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete admin',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetPassword = async (admin: AdminListItem) => {
    setResetPasswordModal({ isOpen: true, admin, newPassword: null });
    setIsResetting(true);

    try {
      const response = await fetch(`/api/admin/admins/${admin.id}/reset-password`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setResetPasswordModal((prev) => ({ ...prev, newPassword: data.newPassword }));
      addToast({
        variant: 'success',
        message: 'Password reset successfully',
      });
    } catch (error) {
      log.error('Error resetting password', error, { action: 'resetPassword' });
      addToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to reset password',
      });
      setResetPasswordModal({ isOpen: false, admin: null, newPassword: null });
    } finally {
      setIsResetting(false);
    }
  };

  const handleUnlock = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/admins/${id}/unlock`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unlock admin');
      }

      addToast({
        variant: 'success',
        message: 'Admin account unlocked successfully',
      });

      fetchAdmins();
    } catch (error) {
      log.error('Error unlocking admin', error, { action: 'unlockAdmin' });
      addToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to unlock admin',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Manage Admins</h2>
          <p className="text-gray-500 mt-1">
            {pagination.total} admin{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/admins/new">
            <Plus className="w-4 h-4 mr-2" /> Add Admin
          </Link>
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        data={admins}
        columns={columns}
        rowActions={rowActions}
        pagination={pagination}
        sort={sort}
        searchQuery={searchQuery}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSort={handleSort}
        onSearch={handleSearch}
        isLoading={isLoading}
        emptyMessage="No admins found. Create your first admin to get started."
        enableSelection={false}
        getRowId={(row) => row.id}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, admin: null })}
        onConfirm={handleDelete}
        title="Delete Admin"
        recordName={deleteModal.admin?.email ?? ''}
        requireConfirmation={true}
        isLoading={isDeleting}
      />

      {/* Reset Password Modal */}
      {resetPasswordModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => !isResetting && setResetPasswordModal({ isOpen: false, admin: null, newPassword: null })}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {resetPasswordModal.newPassword ? 'Password Reset Complete' : 'Resetting Password...'}
            </h3>

            {isResetting ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : resetPasswordModal.newPassword ? (
              <div className="space-y-4">
                <p className="text-gray-600">
                  The password for <strong>{resetPasswordModal.admin?.email}</strong> has been reset.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 mb-2 font-medium">
                    ⚠️ Save this password now - it will only be shown once!
                  </p>
                  <code className="block bg-white border border-yellow-300 rounded px-3 py-2 text-lg font-mono select-all">
                    {resetPasswordModal.newPassword}
                  </code>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => setResetPasswordModal({ isOpen: false, admin: null, newPassword: null })}
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
