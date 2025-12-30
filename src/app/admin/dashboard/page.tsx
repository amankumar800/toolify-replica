import { getDashboardStats, getRecentTools } from '@/lib/services/admin-dashboard.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PenTool, Archive, Newspaper, Clock } from 'lucide-react';
import Link from 'next/link';

/**
 * Admin Dashboard Page
 * 
 * Server component that displays key platform statistics and recent activity.
 * Uses the admin-dashboard.service to fetch data from Supabase.
 * 
 * Requirements:
 * - 10.1: Display total count of tools from the database
 * - 10.2: Display total count of categories from the database
 * - 10.3: Display total count of AI news articles from the database
 * - 10.4: Display a list of the 5 most recently added tools
 * - 10.5: Protected by admin authentication (handled by layout)
 */
export default async function DashboardPage() {
    // Fetch dashboard statistics using admin dashboard service
    const stats = await getDashboardStats();
    const recentTools = await getRecentTools(5);

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>

            {/* Stats Grid - Requirements 10.1, 10.2, 10.3 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Total Tools Count - Requirement 10.1 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tools</CardTitle>
                        <PenTool className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalTools}</div>
                        <p className="text-xs text-muted-foreground">AI tools in database</p>
                    </CardContent>
                </Card>

                {/* Total Categories Count - Requirement 10.2 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Categories</CardTitle>
                        <Archive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCategories}</div>
                        <p className="text-xs text-muted-foreground">Tool categories</p>
                    </CardContent>
                </Card>

                {/* Total AI News Count - Requirement 10.3 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">AI News</CardTitle>
                        <Newspaper className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalAiNews}</div>
                        <p className="text-xs text-muted-foreground">News articles</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Tools Table - Requirement 10.4 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-gray-500" />
                        <h3 className="font-semibold text-gray-900">Recently Added Tools</h3>
                    </div>
                    <Link 
                        href="/admin/tools" 
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        View all tools →
                    </Link>
                </div>
                {recentTools.length > 0 ? (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Name</th>
                                <th className="px-6 py-3 font-medium">Slug</th>
                                <th className="px-6 py-3 font-medium">Date Added</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {recentTools.map(tool => (
                                <tr key={tool.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 font-medium text-gray-900">
                                        {tool.name}
                                    </td>
                                    <td className="px-6 py-3 text-gray-500">
                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                            {tool.slug}
                                        </code>
                                    </td>
                                    <td className="px-6 py-3 text-gray-500">
                                        {new Date(tool.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        <p>No tools found in the database.</p>
                        <Link 
                            href="/admin/tools/new" 
                            className="mt-2 inline-block text-blue-600 hover:text-blue-800"
                        >
                            Add your first tool →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
