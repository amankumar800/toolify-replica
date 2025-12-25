/**
 * Supabase client utilities for Next.js
 * 
 * Usage:
 * - Client Components: import { createClient } from '@/lib/supabase/client'
 * - Server Components: import { createClient } from '@/lib/supabase/server'
 * - Middleware: import { updateSession } from '@/lib/supabase/middleware'
 */

// Re-export types
export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  // Convenience type aliases for all tables
  ToolRow,
  ToolInsert,
  ToolUpdate,
  CategoryRow,
  CategoryInsert,
  CategoryUpdate,
  CategoryGroupRow,
  CategoryGroupInsert,
  CategoryGroupUpdate,
  SubcategoryRow,
  SubcategoryInsert,
  SubcategoryUpdate,
  ToolCategoryRow,
  ToolCategoryInsert,
  ToolCategoryUpdate,
  FeaturedToolRow,
  FeaturedToolInsert,
  FeaturedToolUpdate,
  FaqRow,
  FaqInsert,
  FaqUpdate,
  UserFavoriteRow,
  UserFavoriteInsert,
  UserFavoriteUpdate,
} from './types'

// Re-export middleware types
export type { UpdateSessionResult } from './middleware'

// Note: Don't re-export clients here to avoid bundling issues.
// Import directly from the specific file based on your context:
// - '@/lib/supabase/client' for Client Components
// - '@/lib/supabase/server' for Server Components
