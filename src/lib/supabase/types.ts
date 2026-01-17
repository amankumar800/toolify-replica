export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string | null
          email: string
          failed_login_attempts: number | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          locked_until: string | null
          password_hash: string
          supabase_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          failed_login_attempts?: number | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          locked_until?: string | null
          password_hash: string
          supabase_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          failed_login_attempts?: number | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          locked_until?: string | null
          password_hash?: string
          supabase_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_news: {
        Row: {
          author_avatar: string | null
          author_name: string | null
          category: string | null
          content: string | null
          created_at: string | null
          id: string
          is_published: boolean | null
          like_count: number | null
          priority_score: number | null
          published_at: string | null
          slug: string
          source_name: string | null
          source_url: string | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_avatar?: string | null
          author_name?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          like_count?: number | null
          priority_score?: number | null
          published_at?: string | null
          slug: string
          source_name?: string | null
          source_url?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_avatar?: string | null
          author_name?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          like_count?: number | null
          priority_score?: number | null
          published_at?: string | null
          slug?: string
          source_name?: string | null
          source_url?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
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
      company_pages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          display_order: number | null
          id: string
          question: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          question: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          question?: string
        }
        Relationships: []
      }
      featured_tools: {
        Row: {
          campaign_id: string | null
          click_count: number | null
          created_at: string | null
          display_order: number | null
          end_date: string | null
          id: string
          impression_count: number | null
          is_sponsored: boolean | null
          placement_type: string | null
          sponsor_name: string | null
          start_date: string | null
          tool_id: string
        }
        Insert: {
          campaign_id?: string | null
          click_count?: number | null
          created_at?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          impression_count?: number | null
          is_sponsored?: boolean | null
          placement_type?: string | null
          sponsor_name?: string | null
          start_date?: string | null
          tool_id: string
        }
        Update: {
          campaign_id?: string | null
          click_count?: number | null
          created_at?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          impression_count?: number | null
          is_sponsored?: boolean | null
          placement_type?: string | null
          sponsor_name?: string | null
          start_date?: string | null
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
      free_ai_tools_categories: {
        Row: {
          created_at: string | null
          description: string
          display_order: number
          icon: string
          id: string
          name: string
          next_category_name: string | null
          next_category_slug: string | null
          previous_category_name: string | null
          previous_category_slug: string | null
          slug: string
          tool_count: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string
          display_order?: number
          icon?: string
          id?: string
          name: string
          next_category_name?: string | null
          next_category_slug?: string | null
          previous_category_name?: string | null
          previous_category_slug?: string | null
          slug: string
          tool_count?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          display_order?: number
          icon?: string
          id?: string
          name?: string
          next_category_name?: string | null
          next_category_slug?: string | null
          previous_category_name?: string | null
          previous_category_slug?: string | null
          slug?: string
          tool_count?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      free_ai_tools_faqs: {
        Row: {
          answer: string
          created_at: string | null
          display_order: number
          id: string
          question: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          display_order?: number
          id?: string
          question: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          display_order?: number
          id?: string
          question?: string
        }
        Relationships: []
      }
      free_ai_tools_featured: {
        Row: {
          badge: string | null
          created_at: string | null
          description: string
          display_order: number
          id: string
          image_url: string
          name: string
          slug: string
        }
        Insert: {
          badge?: string | null
          created_at?: string | null
          description?: string
          display_order?: number
          id?: string
          image_url: string
          name: string
          slug: string
        }
        Update: {
          badge?: string | null
          created_at?: string | null
          description?: string
          display_order?: number
          id?: string
          image_url?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      free_ai_tools_subcategories: {
        Row: {
          category_id: string
          created_at: string | null
          display_order: number
          id: string
          name: string
          tool_count: number
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          display_order?: number
          id?: string
          name: string
          tool_count?: number
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          display_order?: number
          id?: string
          name?: string
          tool_count?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "free_ai_tools_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "free_ai_tools_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      free_ai_tools_tools: {
        Row: {
          category_ids: string[] | null
          created_at: string | null
          description: string
          external_url: string | null
          free_tier_details: string | null
          id: string
          name: string
          pricing: string | null
          slug: string
          subcategory_id: string
          updated_at: string | null
        }
        Insert: {
          category_ids?: string[] | null
          created_at?: string | null
          description?: string
          external_url?: string | null
          free_tier_details?: string | null
          id?: string
          name: string
          pricing?: string | null
          slug: string
          subcategory_id: string
          updated_at?: string | null
        }
        Update: {
          category_ids?: string[] | null
          created_at?: string | null
          description?: string
          external_url?: string | null
          free_tier_details?: string | null
          id?: string
          name?: string
          pricing?: string | null
          slug?: string
          subcategory_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "free_ai_tools_tools_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "free_ai_tools_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      midjourney_prompts: {
        Row: {
          copy_count: number | null
          created_at: string | null
          id: string
          image_url: string | null
          prompt_text: string | null
          slug: string
          sref_code: string | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          copy_count?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          prompt_text?: string | null
          slug: string
          sref_code?: string | null
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          copy_count?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          prompt_text?: string | null
          slug?: string
          sref_code?: string | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
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
          discord_members: number | null
          discord_online_7d: number | null
          discord_url: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_new: boolean | null
          metadata: Json | null
          monthly_visits: number | null
          name: string
          pricing: string | null
          rejection_reason: string | null
          review_count: number | null
          review_score: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          saved_count: number | null
          search_vector: unknown
          short_description: string | null
          slug: string
          status: string | null
          submitter_email: string | null
          submitter_name: string | null
          tags: string[] | null
          updated_at: string | null
          verified: boolean | null
          website_url: string
        }
        Insert: {
          change_percentage?: number | null
          created_at?: string | null
          description?: string | null
          discord_members?: number | null
          discord_online_7d?: number | null
          discord_url?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_new?: boolean | null
          metadata?: Json | null
          monthly_visits?: number | null
          name: string
          pricing?: string | null
          rejection_reason?: string | null
          review_count?: number | null
          review_score?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          saved_count?: number | null
          search_vector?: unknown
          short_description?: string | null
          slug: string
          status?: string | null
          submitter_email?: string | null
          submitter_name?: string | null
          tags?: string[] | null
          updated_at?: string | null
          verified?: boolean | null
          website_url: string
        }
        Update: {
          change_percentage?: number | null
          created_at?: string | null
          description?: string | null
          discord_members?: number | null
          discord_online_7d?: number | null
          discord_url?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_new?: boolean | null
          metadata?: Json | null
          monthly_visits?: number | null
          name?: string
          pricing?: string | null
          rejection_reason?: string | null
          review_count?: number | null
          review_score?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          saved_count?: number | null
          search_vector?: unknown
          short_description?: string | null
          slug?: string
          status?: string | null
          submitter_email?: string | null
          submitter_name?: string | null
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
          custom_icon_color: string | null
          display_order: number | null
          id: string
          is_shortcut: boolean | null
          tool_id: string
          tool_name: string | null
          user_email: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          custom_icon_color?: string | null
          display_order?: number | null
          id?: string
          is_shortcut?: boolean | null
          tool_id: string
          tool_name?: string | null
          user_email: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          custom_icon_color?: string | null
          display_order?: number | null
          id?: string
          is_shortcut?: boolean | null
          tool_id?: string
          tool_name?: string | null
          user_email?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      get_admin_id: { Args: never; Returns: string }
      immutable_to_tsvector: { Args: { "": string }; Returns: unknown }
      immutable_weighted_tsvector: {
        Args: { text_value: string; weight: unknown }
        Returns: unknown
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_active: { Args: never; Returns: boolean }
      tools_search_vector: {
        Args: {
          p_description: string
          p_name: string
          p_short_description: string
          p_tags: string[]
        }
        Returns: unknown
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// ============================================================================
// Convenience type aliases for common table types
// ============================================================================

// Tools
export type ToolRow = Database['public']['Tables']['tools']['Row']
export type ToolInsert = Database['public']['Tables']['tools']['Insert']
export type ToolUpdate = Database['public']['Tables']['tools']['Update']

// Categories
export type CategoryRow = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

// Subcategories
export type SubcategoryRow = Database['public']['Tables']['subcategories']['Row']
export type SubcategoryInsert = Database['public']['Tables']['subcategories']['Insert']
export type SubcategoryUpdate = Database['public']['Tables']['subcategories']['Update']

// Tool Categories (junction table)
export type ToolCategoryRow = Database['public']['Tables']['tool_categories']['Row']
export type ToolCategoryInsert = Database['public']['Tables']['tool_categories']['Insert']
export type ToolCategoryUpdate = Database['public']['Tables']['tool_categories']['Update']

// Featured Tools
export type FeaturedToolRow = Database['public']['Tables']['featured_tools']['Row']
export type FeaturedToolInsert = Database['public']['Tables']['featured_tools']['Insert']
export type FeaturedToolUpdate = Database['public']['Tables']['featured_tools']['Update']

// FAQs
export type FaqRow = Database['public']['Tables']['faqs']['Row']
export type FaqInsert = Database['public']['Tables']['faqs']['Insert']
export type FaqUpdate = Database['public']['Tables']['faqs']['Update']

// User Favorites
export type UserFavoriteRow = Database['public']['Tables']['user_favorites']['Row']
export type UserFavoriteInsert = Database['public']['Tables']['user_favorites']['Insert']
export type UserFavoriteUpdate = Database['public']['Tables']['user_favorites']['Update']

// Company Pages
export type CompanyPageRow = Database['public']['Tables']['company_pages']['Row']
export type CompanyPageInsert = Database['public']['Tables']['company_pages']['Insert']
export type CompanyPageUpdate = Database['public']['Tables']['company_pages']['Update']

// Form data types for admin forms
export interface CompanyPageFormData {
  title: string;
  content: string;
}

// Company Page Slug type
export type CompanyPageSlug = 'about' | 'contact' | 'privacy' | 'terms';

// Social Links
export type SocialLinkRow = Database['public']['Tables']['social_links']['Row']
export type SocialLinkInsert = Database['public']['Tables']['social_links']['Insert']
export type SocialLinkUpdate = Database['public']['Tables']['social_links']['Update']

// Social Links Form Data - for admin social links page
export interface SocialLinksFormData {
  twitter_url: string;
  linkedin_url: string;
  facebook_url: string;
  instagram_url: string;
  community_url: string;
  help_center_url: string;
}

// Social Links API Response types - used as object maps with platform keys
export interface SocialLinksResponse {
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
}

export interface ExternalLinksResponse {
  community?: string;
  help_center?: string;
}

// AI News
export type AINewsRow = Database['public']['Tables']['ai_news']['Row']
export type AINewsInsert = Database['public']['Tables']['ai_news']['Insert']
export type AINewsUpdate = Database['public']['Tables']['ai_news']['Update']

// Midjourney Prompts
export type MidjourneyPromptRow = Database['public']['Tables']['midjourney_prompts']['Row']
export type MidjourneyPromptInsert = Database['public']['Tables']['midjourney_prompts']['Insert']
export type MidjourneyPromptUpdate = Database['public']['Tables']['midjourney_prompts']['Update']

// Midjourney Prompt Type
export type MidjourneyPromptType = 'sref' | 'prompt';

// Tool Status Type
export type ToolStatusType = 'pending' | 'published' | 'rejected' | 'draft';
