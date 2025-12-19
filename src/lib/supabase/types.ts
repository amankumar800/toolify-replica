/**
 * Database types for Supabase - Auto-generated
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

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          metadata: Json | null
          name: string
          slug: string
          tool_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          metadata?: Json | null
          name: string
          slug: string
          tool_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          slug?: string
          tool_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      category_groups: {
        Row: {
          created_at: string | null
          display_order: number | null
          icon_name: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string | null
          display_order: number | null
          id: string
          question: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          question: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          question?: string
        }
        Relationships: []
      }
      featured_tools: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          tool_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          tool_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_tools_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string | null
          display_order: number | null
          id: string
          name: string
          slug: string
          tool_count: number | null
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          name: string
          slug: string
          tool_count?: number | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          name?: string
          slug?: string
          tool_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_categories: {
        Row: {
          category_id: string
          created_at: string | null
          tool_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          tool_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_categories_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          change_percentage: number | null
          created_at: string | null
          description: string | null
          external_url: string | null
          free_tier_details: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_new: boolean | null
          metadata: Json | null
          monthly_visits: number | null
          name: string
          pricing: string | null
          review_count: number | null
          review_score: number | null
          saved_count: number | null
          short_description: string | null
          slug: string
          tags: string[] | null
          updated_at: string | null
          verified: boolean | null
          website_url: string
        }
        Insert: {
          change_percentage?: number | null
          created_at?: string | null
          description?: string | null
          external_url?: string | null
          free_tier_details?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_new?: boolean | null
          metadata?: Json | null
          monthly_visits?: number | null
          name: string
          pricing?: string | null
          review_count?: number | null
          review_score?: number | null
          saved_count?: number | null
          short_description?: string | null
          slug: string
          tags?: string[] | null
          updated_at?: string | null
          verified?: boolean | null
          website_url: string
        }
        Update: {
          change_percentage?: number | null
          created_at?: string | null
          description?: string | null
          external_url?: string | null
          free_tier_details?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_new?: boolean | null
          metadata?: Json | null
          monthly_visits?: number | null
          name?: string
          pricing?: string | null
          review_count?: number | null
          review_score?: number | null
          saved_count?: number | null
          short_description?: string | null
          slug?: string
          tags?: string[] | null
          updated_at?: string | null
          verified?: boolean | null
          website_url?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          tool_id: string
          tool_name: string | null
          user_email: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          tool_id: string
          tool_name?: string | null
          user_email: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          tool_id?: string
          tool_name?: string | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_favorites_tool"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

// Convenience type aliases for all tables

// Tools
export type ToolRow = Tables<'tools'>
export type ToolInsert = TablesInsert<'tools'>
export type ToolUpdate = TablesUpdate<'tools'>

// Categories
export type CategoryRow = Tables<'categories'>
export type CategoryInsert = TablesInsert<'categories'>
export type CategoryUpdate = TablesUpdate<'categories'>

// Category Groups
export type CategoryGroupRow = Tables<'category_groups'>
export type CategoryGroupInsert = TablesInsert<'category_groups'>
export type CategoryGroupUpdate = TablesUpdate<'category_groups'>

// Subcategories
export type SubcategoryRow = Tables<'subcategories'>
export type SubcategoryInsert = TablesInsert<'subcategories'>
export type SubcategoryUpdate = TablesUpdate<'subcategories'>

// Tool Categories (junction table)
export type ToolCategoryRow = Tables<'tool_categories'>
export type ToolCategoryInsert = TablesInsert<'tool_categories'>
export type ToolCategoryUpdate = TablesUpdate<'tool_categories'>

// Featured Tools
export type FeaturedToolRow = Tables<'featured_tools'>
export type FeaturedToolInsert = TablesInsert<'featured_tools'>
export type FeaturedToolUpdate = TablesUpdate<'featured_tools'>

// FAQs
export type FaqRow = Tables<'faqs'>
export type FaqInsert = TablesInsert<'faqs'>
export type FaqUpdate = TablesUpdate<'faqs'>

// User Favorites
export type UserFavoriteRow = Tables<'user_favorites'>
export type UserFavoriteInsert = TablesInsert<'user_favorites'>
export type UserFavoriteUpdate = TablesUpdate<'user_favorites'>
