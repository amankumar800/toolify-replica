'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Wrench,
  Newspaper,
  Sparkles,
  FolderTree,
  Folder,
  FolderOpen,
  Star,
  HelpCircle,
  Users,
  Activity,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface AdminSidebarProps {
  adminEmail: string;
  onSignOut?: () => void;
}

// ============================================
// Navigation Configuration
// Requirements 1.1, 1.2: Navigation groups and routes
// ============================================

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Tools', href: '/admin/tools', icon: Wrench },
      { label: 'AI News', href: '/admin/news', icon: Newspaper },
      { label: 'Prompts', href: '/admin/prompts', icon: Sparkles },
    ],
  },
  {
    label: 'Taxonomy',
    items: [
      { label: 'Category Groups', href: '/admin/category-groups', icon: FolderTree },
      { label: 'Categories', href: '/admin/categories', icon: Folder },
      { label: 'Subcategories', href: '/admin/subcategories', icon: FolderOpen },
    ],
  },
  {
    label: 'Features',
    items: [
      { label: 'Featured Tools', href: '/admin/featured', icon: Star },
      { label: 'FAQs', href: '/admin/faqs', icon: HelpCircle },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Admins', href: '/admin/admins', icon: Users },
      { label: 'User Activity', href: '/admin/user-activity', icon: Activity },
    ],
  },
];

// ============================================
// Helper Functions
// ============================================

/**
 * Check if a route is active based on the current pathname
 * Requirement 1.3: Active route highlighting
 */
function isRouteActive(href: string, pathname: string): boolean {
  // Exact match for dashboard
  if (href === '/admin/dashboard') {
    return pathname === href;
  }
  // For other routes, check if pathname starts with href followed by / or end of string
  // This prevents /admin/news from matching /admin/newsletter
  return pathname === href || pathname.startsWith(href + '/');
}

// ============================================
// Navigation Item Component
// ============================================

interface NavItemComponentProps {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}

function NavItemComponent({ item, isActive, onClick }: NavItemComponentProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors touch-target',
        'hover:bg-gray-50 hover:text-blue-600',
        isActive
          ? 'bg-blue-50 text-blue-600 font-medium'
          : 'text-gray-700'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Requirement 1.4: Display icon for each navigation item */}
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="font-medium">{item.label}</span>
    </Link>
  );
}

// ============================================
// Navigation Group Component
// ============================================

interface NavGroupComponentProps {
  group: NavGroup;
  pathname: string;
  onItemClick?: () => void;
}

function NavGroupComponent({ group, pathname, onItemClick }: NavGroupComponentProps) {
  return (
    <div className="space-y-1">
      <h3 className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {group.label}
      </h3>
      {group.items.map((item) => (
        <NavItemComponent
          key={item.href}
          item={item}
          isActive={isRouteActive(item.href, pathname)}
          onClick={onItemClick}
        />
      ))}
    </div>
  );
}


// ============================================
// Mobile Overlay Component
// ============================================

interface MobileOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

function MobileOverlay({ isOpen, onClose }: MobileOverlayProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 md:hidden"
      onClick={onClose}
      aria-hidden="true"
    />
  );
}

// ============================================
// Sidebar Content Component
// ============================================

interface SidebarContentProps {
  adminEmail: string;
  pathname: string;
  onItemClick?: () => void;
  onSignOut?: () => void;
}

function SidebarContent({ adminEmail, pathname, onItemClick, onSignOut }: SidebarContentProps) {
  return (
    <>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          AI Tools Book Admin
        </h1>
        {/* Requirement 1.6: Display admin email */}
        <p className="text-xs text-gray-500 mt-1 truncate" title={adminEmail}>
          {adminEmail}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {navGroups.map((group) => (
          <NavGroupComponent
            key={group.label}
            group={group}
            pathname={pathname}
            onItemClick={onItemClick}
          />
        ))}
      </nav>

      {/* Sign Out Button - Requirement 1.7 */}
      <div className="p-4 border-t border-gray-100">
        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            onClick={onSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-600 rounded-lg hover:bg-red-50 transition-colors touch-target"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </form>
      </div>
    </>
  );
}

// ============================================
// Main AdminSidebar Component
// ============================================

/**
 * AdminSidebar Component
 * 
 * Provides navigation for the admin panel with responsive behavior.
 * 
 * Requirements:
 * - 1.1: Display navigation groups (Overview, Content, Taxonomy, Features, System)
 * - 1.2: Navigate to correct routes on click
 * - 1.3: Highlight active navigation item
 * - 1.4: Display icon for each navigation item
 * - 1.5: Collapse to hamburger menu on viewport < 768px
 * - 1.6: Display admin email
 * - 1.7: Sign out button triggers logout flow
 * - 22.1: Responsive sidebar collapse
 */
export function AdminSidebar({ adminEmail, onSignOut }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <>
      {/* Mobile Hamburger Button - Requirement 1.5, 22.1 */}
      <button
        type="button"
        onClick={toggleMobileMenu}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-gray-200 shadow-sm md:hidden touch-target"
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMobileMenuOpen}
        aria-controls="admin-sidebar"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Mobile Overlay */}
      <MobileOverlay isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />

      {/* Mobile Drawer - Requirement 1.5, 22.1 */}
      <aside
        id="admin-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col',
          'transform transition-transform duration-300 ease-in-out md:hidden',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Admin navigation"
      >
        <SidebarContent
          adminEmail={adminEmail}
          pathname={pathname}
          onItemClick={closeMobileMenu}
          onSignOut={onSignOut}
        />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col flex-shrink-0"
        aria-label="Admin navigation"
      >
        <SidebarContent
          adminEmail={adminEmail}
          pathname={pathname}
          onSignOut={onSignOut}
        />
      </aside>
    </>
  );
}

// Export navigation configuration for testing
export { navGroups, isRouteActive };
export type { NavGroup, NavItem };
