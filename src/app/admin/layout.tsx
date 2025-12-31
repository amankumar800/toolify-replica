import { redirect } from 'next/navigation';
import { getAdminFromRequest } from '@/lib/services/admin-auth.service';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ToastProvider } from '@/components/admin/Toast';
import { GlobalSearch } from '@/components/admin/GlobalSearch';
import { UnsavedChangesProvider } from '@/components/admin/UnsavedChangesProvider';

/**
 * Admin Layout Component
 * 
 * Server component that provides the layout for all admin pages.
 * Uses the dedicated admin authentication system (not Supabase Auth).
 * 
 * Requirements:
 * - 1.1-1.7: Admin navigation sidebar with groups and routes
 * - 9.1: Uses Admin_Session instead of Supabase Auth
 * - 9.2: Displays admin email from Admin_Session
 * - 9.3: No dependencies on Supabase Auth
 * - 9.4: Includes logout button calling /api/admin/logout
 * - 9.5: Redirects to /admin/login if session invalid
 * - 13.5: Unsaved changes warning when navigating away
 * - 13.6: Toast notifications for success/error messages
 * - 16.1-16.8: Global search functionality in header
 * - 22.1: Responsive sidebar collapse
 */
export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Get admin from session cookie (Req 9.1, 9.3)
    const admin = await getAdminFromRequest();

    // Redirect to login if no valid session (Req 9.5)
    if (!admin) {
        redirect('/admin/login');
    }

    return (
        <ToastProvider>
            <UnsavedChangesProvider>
                <div className="flex h-screen bg-gray-100">
                    {/* Admin Sidebar - Requirements 1.1-1.7, 22.1 */}
                    <AdminSidebar adminEmail={admin.email} />

                    {/* Main Content */}
                    <main className="flex-1 overflow-y-auto">
                        {/* Header - Requirements 13.6, 16.1-16.8 */}
                        <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-10 gap-4">
                            {/* Spacer for mobile hamburger menu */}
                            <div className="w-10 md:hidden flex-shrink-0" />
                            
                            {/* Global Search - Requirements 16.1-16.8 */}
                            <GlobalSearch className="flex-1 max-w-md" />

                            <div className="flex items-center gap-4 flex-shrink-0">
                                <span className="text-sm text-gray-500 hidden sm:inline">Admin</span>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                    {admin.email?.[0].toUpperCase()}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 md:p-8">
                            {children}
                        </div>
                    </main>
                </div>
            </UnsavedChangesProvider>
        </ToastProvider>
    );
}
