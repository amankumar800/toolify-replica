/**
 * Database types for Supabase
 *
 * This file contains TypeScript interfaces matching the database schema
 * for the AI Tools Book directory application (10-table optimized schema).
 *
 * To regenerate types after schema changes, run:
 * ```bash
 * npx supabase gen types typescript --project-id sxepzgwkbsynilkronsj > src/lib/supabase/types.ts
 * ```
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * Valid pricing types for tools.
 * Enforced by CHECK constraint in database.
 */
export type PricingType = 'Free' | 'Freemium' | 'Paid' | 'Free Trial' | 'Contact for Pricing';

/**
 * Valid status types for tool submission workflow.
 * Enforced by CHECK constraint in database.
 */
export type ToolStatusType = 'draft' | 'pending' | 'published' | 'rejected';

/**
 * Valid placement types for featured tools.
 * Enforced by CHECK constraint in database.
 */
export type PlacementType = 'homepage' | 'category' | 'search';

/**
 * Valid entry types for Midjourney prompts.
 * Enforced by CHECK constraint in database.
 */
export type MidjourneyPromptType = 'sref' | 'prompt';

export type Database = {
  public: {
    Tables: {
      // 1. category_groups - Groups related categories for navigation hierarchy
      category_groups: {
        Row: {
          id: string
          name: string
          icon_name: string | null
          display_order: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          icon_name?: string | null
          display_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          icon_name?: string | null
          display_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }

      // 2. categories - Organizes tools into browsable categories
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          tool_count: number | null
          display_order: number | null
          group_id: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          tool_count?: number | null
          display_order?: number | null
          group_id?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          tool_count?: number | null
          display_order?: number | null
          group_id?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "category_groups"
            referencedColumns: ["id"]
          }
        ]
      }

      // 3. subcategories - Finer-grained categorization within categories
      subcategories: {
        Row: {
          id: string
          category_id: string
          name: string
          slug: string
          tool_count: number | null
          display_order: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          slug: string
          tool_count?: number | null
          display_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          slug?: string
          tool_count?: number | null
          display_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }

      // 4. tools - Primary table storing AI tool information with submission workflow
      tools: {
        Row: {
          // Core identification
          id: string
          name: string
          slug: string
          description: string | null
          short_description: string | null
          image_url: string | null
          website_url: string
          // Classification
          pricing: string | null
          tags: string[] | null
          // Engagement metrics
          saved_count: number | null
          review_count: number | null
          review_score: number | null
          // Display flags
          verified: boolean | null
          is_new: boolean | null
          is_featured: boolean | null
          // Ranking data
          monthly_visits: number | null
          change_percentage: number | null
          // Extensibility
          metadata: Json | null
          // Timestamps
          created_at: string | null
          updated_at: string | null
          // Submission workflow (merged from tool_submissions)
          status: string | null
          submitter_email: string | null
          submitter_name: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          // Full-text search (generated column - read only)
          search_vector: unknown | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          image_url?: string | null
          website_url: string
          pricing?: string | null
          tags?: string[] | null
          saved_count?: number | null
          review_count?: number | null
          review_score?: number | null
          verified?: boolean | null
          is_new?: boolean | null
          is_featured?: boolean | null
          monthly_visits?: number | null
          change_percentage?: number | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          status?: string | null
          submitter_email?: string | null
          submitter_name?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          // search_vector is generated, not insertable
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          image_url?: string | null
          website_url?: string
          pricing?: string | null
          tags?: string[] | null
          saved_count?: number | null
          review_count?: number | null
          review_score?: number | null
          verified?: boolean | null
          is_new?: boolean | null
          is_featured?: boolean | null
          monthly_visits?: number | null
          change_percentage?: number | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          status?: string | null
          submitter_email?: string | null
          submitter_name?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          // search_vector is generated, not updatable
        }
        Relationships: [
          {
            foreignKeyName: "tools_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }

      // 5. tool_categories - Junction table for many-to-many tools/categories
      tool_categories: {
        Row: {
          tool_id: string
          category_id: string
          created_at: string | null
        }
        Insert: {
          tool_id: string
          category_id: string
          created_at?: string | null
        }
        Update: {
          tool_id?: string
          category_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_categories_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }

      // 6. featured_tools - Manages featured and sponsored tool placements
      featured_tools: {
        Row: {
          id: string
          tool_id: string
          display_order: number | null
          placement_type: string | null
          is_sponsored: boolean | null
          sponsor_name: string | null
          campaign_id: string | null
          start_date: string | null
          end_date: string | null
          impression_count: number | null
          click_count: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          tool_id: string
          display_order?: number | null
          placement_type?: string | null
          is_sponsored?: boolean | null
          sponsor_name?: string | null
          campaign_id?: string | null
          start_date?: string | null
          end_date?: string | null
          impression_count?: number | null
          click_count?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          tool_id?: string
          display_order?: number | null
          placement_type?: string | null
          is_sponsored?: boolean | null
          sponsor_name?: string | null
          campaign_id?: string | null
          start_date?: string | null
          end_date?: string | null
          impression_count?: number | null
          click_count?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "featured_tools_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          }
        ]
      }

      // 7. faqs - Stores frequently asked questions with page-specific targeting
      faqs: {
        Row: {
          id: string
          question: string
          answer: string
          display_order: number | null
          category: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          question: string
          answer: string
          display_order?: number | null
          category?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          question?: string
          answer?: string
          display_order?: number | null
          category?: string | null
          created_at?: string | null
        }
        Relationships: []
      }

      // 8. user_favorites - Stores user-specific tool favorites and shortcuts
      user_favorites: {
        Row: {
          id: string
          user_email: string
          tool_id: string
          tool_name: string | null
          category_id: string | null
          is_shortcut: boolean | null
          display_order: number | null
          custom_icon_color: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_email: string
          tool_id: string
          tool_name?: string | null
          category_id?: string | null
          is_shortcut?: boolean | null
          display_order?: number | null
          custom_icon_color?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_email?: string
          tool_id?: string
          tool_name?: string | null
          category_id?: string | null
          is_shortcut?: boolean | null
          display_order?: number | null
          custom_icon_color?: string | null
          created_at?: string | null
        }
        Relationships: []
      }

      // 9. midjourney_prompts - Stores Midjourney SREF codes and prompts
      midjourney_prompts: {
        Row: {
          id: string
          title: string
          slug: string
          sref_code: string | null
          prompt_text: string | null
          image_url: string | null
          type: string
          tags: string[] | null
          view_count: number | null
          copy_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          sref_code?: string | null
          prompt_text?: string | null
          image_url?: string | null
          type: string
          tags?: string[] | null
          view_count?: number | null
          copy_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          sref_code?: string | null
          prompt_text?: string | null
          image_url?: string | null
          type?: string
          tags?: string[] | null
          view_count?: number | null
          copy_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }

      // 10. ai_news - Stores AI news articles and blog posts
      ai_news: {
        Row: {
          id: string
          title: string
          slug: string
          summary: string | null
          content: string | null
          author_name: string | null
          author_avatar: string | null
          source_name: string | null
          source_url: string | null
          category: string | null
          tags: string[] | null
          view_count: number | null
          like_count: number | null
          priority_score: number | null
          is_published: boolean | null
          published_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          summary?: string | null
          content?: string | null
          author_name?: string | null
          author_avatar?: string | null
          source_name?: string | null
          source_url?: string | null
          category?: string | null
          tags?: string[] | null
          view_count?: number | null
          like_count?: number | null
          priority_score?: number | null
          is_published?: boolean | null
          published_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          summary?: string | null
          content?: string | null
          author_name?: string | null
          author_avatar?: string | null
          source_name?: string | null
          source_url?: string | null
          category?: string | null
          tags?: string[] | null
          view_count?: number | null
          like_count?: number | null
          priority_score?: number | null
          is_published?: boolean | null
          published_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
type DefaultSchema = Database['public']

export type Tables<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Row']

export type TablesInsert<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Update']

// ============================================================================
// Convenience type aliases for all tables
// ============================================================================

// 1. Category Groups
export type CategoryGroupRow = Tables<'category_groups'>
export type CategoryGroupInsert = TablesInsert<'category_groups'>
export type CategoryGroupUpdate = TablesUpdate<'category_groups'>

// 2. Categories
export type CategoryRow = Tables<'categories'>
export type CategoryInsert = TablesInsert<'categories'>
export type CategoryUpdate = TablesUpdate<'categories'>

// 3. Subcategories
export type SubcategoryRow = Tables<'subcategories'>
export type SubcategoryInsert = TablesInsert<'subcategories'>
export type SubcategoryUpdate = TablesUpdate<'subcategories'>

// 4. Tools
export type ToolRow = Tables<'tools'>
export type ToolInsert = TablesInsert<'tools'>
export type ToolUpdate = TablesUpdate<'tools'>

// 5. Tool Categories (junction table)
export type ToolCategoryRow = Tables<'tool_categories'>
export type ToolCategoryInsert = TablesInsert<'tool_categories'>
export type ToolCategoryUpdate = TablesUpdate<'tool_categories'>

// 6. Featured Tools
export type FeaturedToolRow = Tables<'featured_tools'>
export type FeaturedToolInsert = TablesInsert<'featured_tools'>
export type FeaturedToolUpdate = TablesUpdate<'featured_tools'>

// 7. FAQs
export type FaqRow = Tables<'faqs'>
export type FaqInsert = TablesInsert<'faqs'>
export type FaqUpdate = TablesUpdate<'faqs'>

// 8. User Favorites
export type UserFavoriteRow = Tables<'user_favorites'>
export type UserFavoriteInsert = TablesInsert<'user_favorites'>
export type UserFavoriteUpdate = TablesUpdate<'user_favorites'>

// 9. Midjourney Prompts
export type MidjourneyPromptRow = Tables<'midjourney_prompts'>
export type MidjourneyPromptInsert = TablesInsert<'midjourney_prompts'>
export type MidjourneyPromptUpdate = TablesUpdate<'midjourney_prompts'>

// 10. AI News
export type AINewsRow = Tables<'ai_news'>
export type AINewsInsert = TablesInsert<'ai_news'>
export type AINewsUpdate = TablesUpdate<'ai_news'>

// ============================================================================
// Application-level interfaces (camelCase, with defaults applied)
// These are used throughout the application after mapping from database rows
// ============================================================================

/**
 * Tool interface for application use.
 * Maps from ToolRow with camelCase properties and defaults applied.
 */
export interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  imageUrl: string;
  websiteUrl: string;
  pricing: PricingType;
  tags: string[];
  savedCount: number;
  reviewCount: number;
  reviewScore: number;
  verified: boolean;
  isNew: boolean;
  isFeatured: boolean;
  monthlyVisits?: number;
  changePercentage?: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  // Submission workflow fields
  status: ToolStatusType;
  submitterEmail?: string;
  submitterName?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  // Populated by joins
  categories?: string[];
}

/**
 * Category interface for application use.
 * Maps from CategoryRow with camelCase properties and defaults applied.
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  toolCount: number;
  displayOrder: number;
  groupId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * CategoryGroup interface for application use.
 * Maps from CategoryGroupRow with camelCase properties and defaults applied.
 */
export interface CategoryGroup {
  id: string;
  name: string;
  iconName: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  // Populated by joins
  categories?: Category[];
}

/**
 * Subcategory interface for application use.
 * Maps from SubcategoryRow with camelCase properties and defaults applied.
 */
export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  toolCount: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * ToolCategory junction interface for application use.
 * Maps from ToolCategoryRow with camelCase properties.
 */
export interface ToolCategory {
  toolId: string;
  categoryId: string;
  createdAt: string;
}

/**
 * FeaturedTool interface for application use.
 * Maps from FeaturedToolRow with camelCase properties and defaults applied.
 */
export interface FeaturedTool {
  id: string;
  toolId: string;
  displayOrder: number;
  placementType: PlacementType;
  isSponsored: boolean;
  sponsorName?: string;
  campaignId?: string;
  startDate?: string;
  endDate?: string;
  impressionCount: number;
  clickCount: number;
  createdAt: string;
  // Populated by joins
  tool?: Tool;
}

/**
 * FAQ interface for application use.
 * Maps from FaqRow with camelCase properties and defaults applied.
 */
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  displayOrder: number;
  category: string;
  createdAt: string;
}

/**
 * UserFavorite interface for application use.
 * Maps from UserFavoriteRow with camelCase properties and defaults applied.
 */
export interface UserFavorite {
  id: string;
  userEmail: string;
  toolId: string;
  toolName?: string;
  categoryId?: string;
  isShortcut: boolean;
  displayOrder: number;
  customIconColor?: string;
  createdAt: string;
}

/**
 * MidjourneyPrompt interface for application use.
 * Maps from MidjourneyPromptRow with camelCase properties and defaults applied.
 */
export interface MidjourneyPrompt {
  id: string;
  title: string;
  slug: string;
  srefCode?: string;
  promptText?: string;
  imageUrl?: string;
  type: MidjourneyPromptType;
  tags: string[];
  viewCount: number;
  copyCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * AINews interface for application use.
 * Maps from AINewsRow with camelCase properties and defaults applied.
 */
export interface AINews {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  authorName?: string;
  authorAvatar?: string;
  sourceName?: string;
  sourceUrl?: string;
  category?: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  priorityScore: number;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}
