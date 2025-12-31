/**
 * Edit Admin Page
 *
 * Admin page for editing existing admin users.
 *
 * Requirements: 11.4, 11.5
 */

import { notFound } from 'next/navigation';
import { AdminForm } from '@/components/admin/AdminForm';
import { getAdminById } from '@/lib/services/admins.service';

interface EditAdminPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAdminPage({ params }: EditAdminPageProps) {
  const { id } = await params;
  const admin = await getAdminById(id);

  if (!admin) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Edit Admin</h2>
        <p className="text-gray-500 mt-1">
          Update admin account: {admin.email}
        </p>
      </div>

      <AdminForm isNew={false} initialData={admin} />
    </div>
  );
}
