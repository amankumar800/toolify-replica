import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, PenTool, Image as ImageIcon, LogOut, Search } from 'lucide-react';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Server-side role verification (defense in depth)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login?callbackUrl=/admin');
    }

    // Check role from user metadata
    if (user.user_metadata?.role !== 'admin') {
        redirect('/unauthorized');
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        AI Tools Book Admin
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors">
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="font-medium">Dashboard</span>
                    </Link>

                    <Link href="/admin/tools" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors">
                        <PenTool className="w-5 h-5" />
                        <span className="font-medium">Tools</span>
                    </Link>

                    <Link href="/admin/prompts" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors">
                        <ImageIcon className="w-5 h-5" />
                        <span className="font-medium">Prompts</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <Link
                        href="/api/auth/signout"
                        className="flex items-center gap-3 px-4 py-3 w-full text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">Admin</span>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                            {user.email?.[0].toUpperCase()}
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
