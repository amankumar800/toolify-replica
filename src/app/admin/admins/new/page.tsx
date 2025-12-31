/**
 * Create New Admin Page
 *
 * Admin page for creating new admin users.
 *
 * Requirements: 11.4
 */

import { AdminForm } from '@/components/admin/AdminForm';

export default function NewAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Create Admin</h2>
        <p className="text-gray-500 mt-1">
          Add a new administrator to the platform
        </p>
      </div>

      <AdminForm isNew={true} />
    </div>
  );
}
