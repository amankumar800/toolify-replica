import { getDashboardStats, getRecentActivity } from '@/lib/services/admin-dashboard.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PenTool, 
  Archive, 
  Newspaper, 
  Clock, 
  Folder, 
  FolderOpen,
  Sparkles,
  HelpCircle,
  Star,
  Users,
  Plus
} from 'lucide-react';
import Link from 'next/link';

/**
 * Stat card configuration for dashboard display.
 */
interface StatCardConfig {
  title: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

/**
 * Admin Dashboard Page
 * 
 * Server component that displays key platform statistics and recent activity.
 * Uses the admin-dashboard.service to fetch data from Supabase.
 * 
 * Requirements:
 * - 2.1: Display stat cards for all tables
 * - 2.2: Stat cards navigate to corresponding management section on click
 * - 2.3: Display recent activity section (10 most recent across tools, news, prompts)
 * - 2.4: Provide quick action buttons (Add Tool, Add News, Add Prompt, Add FAQ)
 * - 2.5: Quick action buttons navigate to corresponding create forms
 * - 22.5: Responsive stat card layout (single column on mobile)
 */
export default async function DashboardPage() {
  // Fetch dashboard statistics and recent activity
  const [stats, recentActivity] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(10),
  ]);

  // Configure stat cards - Requirements 2.1, 2.2
  const statCards: StatCardConfig[] = [
    {
      title: 'Total Tools',
      value: stats.totalTools,
      description: 'AI tools in database',
      icon: PenTool,
      href: '/admin/tools',
    },
    {
      title: 'Categories',
      value: stats.totalCategories,
      description: 'Tool categories',
      icon: Folder,
      href: '/admin/categories',
    },
    {
      title: 'Subcategories',
      value: stats.totalSubcategories,
      description: 'Category subdivisions',
      icon: FolderOpen,
      href: '/admin/subcategories',
    },
    {
      title: 'AI News',
      value: stats.totalAiNews,
      description: 'News articles',
      icon: Newspaper,
      href: '/admin/news',
    },
    {
      title: 'Prompts',
      value: stats.totalPrompts,
      description: 'Midjourney prompts',
      icon: Sparkles,
      href: '/admin/prompts',
    },
    {
      title: 'FAQs',
      value: stats.totalFaqs,
      description: 'FAQ entries',
      icon: HelpCircle,
      href: '/admin/faqs',
    },
    {
      title: 'Active Featured',
      value: stats.activeFeaturedTools,
      description: 'Featured tools',
      icon: Star,
      href: '/admin/featured',
    },
    {
      title: 'Admins',
      value: stats.totalAdmins,
      description: 'Admin accounts',
      icon: Users,
      href: '/admin/admins',
    },
  ];

  // Quick action buttons - Requirements 2.4, 2.5
  const quickActions = [
    { label: 'Add Tool', href: '/admin/tools/new', icon: PenTool },
    { label: 'Add News', href: '/admin/news/new', icon: Newspaper },
    { label: 'Add Prompt', href: '/admin/prompts/new', icon: Sparkles },
    { label: 'Add FAQ', href: '/admin/faqs/new', icon: HelpCircle },
  ];

  // Get type label and icon for activity items
  const getTypeConfig = (type: 'tool' | 'news' | 'prompt') => {
    switch (type) {
      case 'tool':
        return { label: 'Tool', icon: PenTool, color: 'text-blue-600 bg-blue-50' };
      case 'news':
        return { label: 'News', icon: Newspaper, color: 'text-green-600 bg-green-50' };
      case 'prompt':
        return { label: 'Prompt', icon: Sparkles, color: 'text-purple-600 bg-purple-50' };
    }
  };

  // Get edit URL for activity item
  const getEditUrl = (type: 'tool' | 'news' | 'prompt', id: string) => {
    switch (type) {
      case 'tool':
        return `/admin/tools/${id}/edit`;
      case 'news':
        return `/admin/news/${id}/edit`;
      case 'prompt':
        return `/admin/prompts/${id}/edit`;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        
        {/* Quick Actions - Requirements 2.4, 2.5 */}
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Grid - Requirements 2.1, 2.2, 22.5 */}
      {/* Responsive: single column on mobile, 2 cols on md, 3 cols on lg */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href} className="block">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity Section - Requirement 2.3 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <span className="text-sm text-gray-500">
            Last 10 updates across tools, news, and prompts
          </span>
        </div>
        {recentActivity.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {recentActivity.map((item) => {
              const typeConfig = getTypeConfig(item.type);
              const TypeIcon = typeConfig.icon;
              const editUrl = getEditUrl(item.type, item.id);
              
              return (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={editUrl}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                    <TypeIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-sm text-gray-500">
                      <span className="capitalize">{item.action}</span>
                      {' · '}
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                        {item.slug}
                      </code>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${typeConfig.color}`}>
                      {typeConfig.label}
                    </span>
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>No recent activity found.</p>
            <p className="mt-2 text-sm">
              Start by adding tools, news articles, or prompts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
