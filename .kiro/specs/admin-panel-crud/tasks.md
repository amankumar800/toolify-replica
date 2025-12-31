# Implementation Plan: Admin Panel CRUD

## Overview

This implementation plan breaks down the admin panel CRUD feature into discrete, incremental tasks. The approach prioritizes building reusable components first, then implementing each admin section using those components. TypeScript with Next.js App Router is used throughout.

## Tool Usage Guide

Each task includes recommended tools:
- 🧠 **Sequential Thinking MCP** - For complex logic, architecture decisions, multi-step problem solving
- 🌐 **Web Browser MCP** - For researching libraries, documentation, best practices
- 🎭 **Playwright MCP** - For UI verification, visual testing, interaction testing
- 🗄️ **Supabase MCP** - For database operations, schema verification, data validation

## Tasks

- [x] 1. Set up core admin infrastructure
  - [x] 1.1 Create admin types and interfaces
    - 🧠 **Use Sequential Thinking MCP** for designing type hierarchy
    - Create `src/lib/types/admin-forms.ts` with all form data types
    - Create `src/lib/services/admin-crud.types.ts` with pagination, filter, and response types
    - _Requirements: 3.8, 4.4, 5.5, 6.5, 7.6, 8.4, 9.5, 10.5, 11.4_

  - [x] 1.2 Create admin validation schemas
    - 🧠 **Use Sequential Thinking MCP** for complex validation logic design
    - 🌐 **Use Web Browser MCP** to research Zod best practices
    - Create `src/lib/utils/admin-validation.ts` with Zod schemas for all entities
    - Include slug regex, conditional validations (sref_code, sponsor_name)
    - _Requirements: 14.1, 14.2, 14.9, 14.10_

  - [x] 1.3 Write property tests for validation schemas
    - 🧠 **Use Sequential Thinking MCP** for test case design
    - **Property 16: Conditional Field Validation**
    - **Property 20: Form Validation**
    - **Property 21: Required Field Validation**
    - **Property 22: URL Field Validation**
    - **Validates: Requirements 8.6, 10.7, 14.1, 14.2, 14.9, 14.10**

- [x] 2. Implement Toast notification system
  - [x] 2.1 Create Toast context and provider
    - 🧠 **Use Sequential Thinking MCP** for state management design
    - 🌐 **Use Web Browser MCP** to research React toast patterns
    - Create `src/components/admin/Toast.tsx` with ToastProvider and useToast hook
    - Implement success, error, warning, info variants
    - Implement auto-dismiss after 5000ms
    - _Requirements: 15.6, 15.7, 15.8_

  - [x] 2.2 Write property test for toast auto-dismiss
    - **Property 23: Toast Auto-Dismiss**
    - **Validates: Requirements 15.7**

- [x] 3. Implement AdminSidebar component
  - [x] 3.1 Create AdminSidebar component
    - 🧠 **Use Sequential Thinking MCP** for navigation structure design
    - Create `src/components/admin/AdminSidebar.tsx`
    - Implement navigation groups: Overview, Content, Taxonomy, Features, System
    - Implement route highlighting for active path
    - Display admin email and sign out button
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7_

  - [x] 3.2 Implement responsive sidebar behavior
    - 🎭 **Use Playwright MCP** to verify responsive behavior at different viewports
    - Collapse to hamburger menu on viewport < 768px
    - Implement mobile drawer with overlay
    - _Requirements: 1.5, 22.1_

  - [x] 3.3 Write property tests for sidebar
    - 🎭 **Use Playwright MCP** to verify navigation and highlighting
    - **Property 1: Navigation Route Mapping**
    - **Property 2: Active Route Highlighting**
    - **Property 3: Responsive Sidebar Collapse**
    - **Validates: Requirements 1.2, 1.3, 1.5, 22.1**

- [x] 4. Implement DataTable component
  - [x] 4.1 Create base DataTable component
    - 🧠 **Use Sequential Thinking MCP** for component architecture
    - 🌐 **Use Web Browser MCP** to research table component patterns
    - Create `src/components/admin/DataTable.tsx`
    - Implement column rendering with custom cell renderers
    - Implement loading skeleton and empty state
    - _Requirements: 13.1_

  - [x] 4.2 Implement pagination
    - 🧠 **Use Sequential Thinking MCP** for pagination logic
    - Add page navigation controls
    - Support configurable page sizes (10, 20, 50)
    - Display current page and total count
    - _Requirements: 3.2, 13.1_

  - [x] 4.3 Implement sorting
    - Add sortable column headers with indicators
    - Support ascending/descending toggle
    - _Requirements: 3.3, 7.3_

  - [x] 4.4 Implement filtering and search
    - 🧠 **Use Sequential Thinking MCP** for filter logic design
    - Add global search input with debounce
    - Add column-specific filter dropdowns
    - _Requirements: 3.4, 3.5_

  - [x] 4.5 Implement row selection and bulk actions
    - 🧠 **Use Sequential Thinking MCP** for selection state management
    - Add checkbox selection for rows
    - Display selected count and bulk action buttons
    - Implement confirmation for destructive actions
    - _Requirements: 3.7, 7.4, 13.4_

  - [x] 4.6 Implement row actions dropdown
    - Add actions dropdown per row (Edit, Delete, etc.)
    - Support conditional action visibility
    - _Requirements: 3.6_

  - [x] 4.7 Implement responsive DataTable behavior
    - 🎭 **Use Playwright MCP** to verify responsive behavior
    - Make table horizontally scrollable on mobile
    - Convert row actions to dropdown on mobile
    - _Requirements: 22.2, 22.4_

  - [x] 4.8 Write property tests for DataTable
    - 🎭 **Use Playwright MCP** for UI interaction testing
    - **Property 5: DataTable Pagination**
    - **Property 6: DataTable Sorting**
    - **Property 7: DataTable Filtering**
    - **Property 8: DataTable Search**
    - **Property 9: Bulk Action Application**
    - **Property 34: Responsive DataTable**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.7, 7.3, 7.4, 13.1, 22.2**

- [x] 5. Implement form field components
  - [x] 5.1 Create base form field components
    - 🧠 **Use Sequential Thinking MCP** for form field architecture
    - 🌐 **Use Web Browser MCP** to research form field best practices
    - Create `src/components/admin/form-fields/TextField.tsx`
    - Create `src/components/admin/form-fields/TextareaField.tsx`
    - Create `src/components/admin/form-fields/NumberField.tsx`
    - Create `src/components/admin/form-fields/SelectField.tsx`
    - Include character counters, validation error display
    - _Requirements: 13.2, 14.3, 14.4_

  - [x] 5.2 Create advanced form field components
    - 🧠 **Use Sequential Thinking MCP** for complex field logic
    - Create `src/components/admin/form-fields/MultiSelectField.tsx`
    - Create `src/components/admin/form-fields/SearchableSelectField.tsx`
    - Create `src/components/admin/form-fields/ToggleField.tsx`
    - Create `src/components/admin/form-fields/DateField.tsx`
    - _Requirements: 13.2_

  - [x] 5.3 Create specialized form field components
    - 🧠 **Use Sequential Thinking MCP** for WYSIWYG and upload logic
    - 🌐 **Use Web Browser MCP** to research rich text editor libraries
    - Create `src/components/admin/form-fields/RichTextField.tsx` (WYSIWYG)
    - Create `src/components/admin/form-fields/ImageUploadField.tsx`
    - Create `src/components/admin/form-fields/TagInputField.tsx`
    - Create `src/components/admin/form-fields/JsonEditorField.tsx`
    - Create `src/components/admin/form-fields/IconPickerField.tsx`
    - _Requirements: 13.2_

  - [x] 5.4 Implement responsive form layout
    - 🎭 **Use Playwright MCP** to verify responsive layout
    - Stack fields vertically on viewport < 640px
    - Ensure touch targets are at least 44x44px
    - _Requirements: 22.3, 22.6_

  - [x] 5.5 Write property tests for form fields
    - 🎭 **Use Playwright MCP** for form interaction testing
    - **Property 35: Responsive Form Layout**
    - **Property 38: Touch Target Size**
    - **Validates: Requirements 22.3, 22.6**

- [x] 6. Implement DeleteModal component
  - [x] 6.1 Create DeleteModal component
    - 🧠 **Use Sequential Thinking MCP** for modal state management
    - 🎭 **Use Playwright MCP** to verify modal interactions
    - Create `src/components/admin/DeleteModal.tsx`
    - Display record name and affected related records
    - Implement "DELETE" confirmation typing for critical operations
    - _Requirements: 13.3_

- [x] 7. Implement GlobalSearch component
  - [x] 7.1 Create GlobalSearch component
    - 🧠 **Use Sequential Thinking MCP** for search architecture
    - 🗄️ **Use Supabase MCP** to verify search queries across tables
    - Create `src/components/admin/GlobalSearch.tsx`
    - Implement search across tools, news, prompts, categories, faqs
    - Implement 300ms debounce
    - Display up to 5 results per type with type labels
    - Highlight matching text
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.7_

  - [x] 7.2 Implement search result navigation
    - 🎭 **Use Playwright MCP** to verify navigation behavior
    - Navigate to edit page on result click
    - Close dropdown on Escape key
    - Display "No results found" when empty
    - _Requirements: 16.5, 16.6, 16.8_

  - [x] 7.3 Write property tests for GlobalSearch
    - 🎭 **Use Playwright MCP** for search UI testing
    - 🗄️ **Use Supabase MCP** to verify search results
    - **Property 24: Global Search Results**
    - **Property 25: Search Debounce**
    - **Property 26: Search Result Navigation**
    - **Validates: Requirements 16.1, 16.2, 16.3, 16.5, 16.7**

- [x] 8. Implement CSV export functionality
  - [x] 8.1 Create CSV export utility
    - 🧠 **Use Sequential Thinking MCP** for export logic design
    - 🌐 **Use Web Browser MCP** to research CSV generation best practices
    - Create `src/lib/utils/csv-export.ts`
    - Include visible columns plus id and timestamps
    - Respect current filters
    - Limit to 10,000 records with warning
    - Handle special characters and newlines
    - Generate filename as `{table_name}_{date}.csv`
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7_

  - [x] 8.2 Write property test for CSV export
    - **Property 27: CSV Export**
    - **Validates: Requirements 17.2, 17.3, 17.4, 17.6, 17.7**

- [x] 9. Update admin layout with new components
  - [x] 9.1 Update admin layout
    - 🧠 **Use Sequential Thinking MCP** for layout integration
    - 🎭 **Use Playwright MCP** to verify layout rendering
    - Update `src/app/admin/layout.tsx` to use AdminSidebar
    - Add GlobalSearch to header
    - Add ToastProvider
    - Implement unsaved changes warning
    - _Requirements: 1.1, 13.5, 13.6_

  - [x] 9.2 Write property test for unsaved changes warning
    - 🎭 **Use Playwright MCP** to verify warning dialog
    - **Property 39: Unsaved Changes Warning**
    - **Validates: Requirements 13.5**

- [x] 10. Checkpoint - Core components complete
  - 🎭 **Use Playwright MCP** to run visual regression tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement enhanced Dashboard
  - [x] 11.1 Update dashboard service
    - 🧠 **Use Sequential Thinking MCP** for query optimization
    - 🗄️ **Use Supabase MCP** to verify count queries and data
    - Update `src/lib/services/admin-dashboard.service.ts`
    - Add counts for all 11 tables
    - Add recent activity query (10 most recent across tools, news, prompts)
    - _Requirements: 2.1, 2.3_

  - [x] 11.2 Update dashboard page
    - 🎭 **Use Playwright MCP** to verify dashboard UI
    - 🗄️ **Use Supabase MCP** to verify stat card data accuracy
    - Update `src/app/admin/dashboard/page.tsx`
    - Display stat cards for all tables with click navigation
    - Display recent activity section
    - Add quick action buttons (Add Tool, Add News, Add Prompt, Add FAQ)
    - Implement responsive stat card layout (single column on mobile)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 22.5_

  - [x] 11.3 Write property tests for dashboard
    - 🎭 **Use Playwright MCP** for navigation and responsive testing
    - **Property 4: Stat Card Navigation**
    - **Property 37: Responsive Dashboard**
    - **Validates: Requirements 2.2, 22.5**

- [x] 12. Implement Tools management
  - [x] 12.1 Update tools list page
    - 🧠 **Use Sequential Thinking MCP** for list page architecture
    - 🗄️ **Use Supabase MCP** to verify tools data queries
    - 🎭 **Use Playwright MCP** to verify list UI
    - Update `src/app/admin/tools/page.tsx` to use DataTable
    - Implement columns: Name, Slug, Status, Pricing, Is Featured, Created Date
    - Implement filters: status, is_featured, pricing, includeArchived
    - Implement bulk actions: Publish, Unpublish, Delete
    - Add Export CSV button
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 17.1_

  - [x] 12.2 Update tool form
    - 🧠 **Use Sequential Thinking MCP** for form field organization
    - 🎭 **Use Playwright MCP** to verify form interactions
    - Update `src/components/admin/ToolForm.tsx` with all fields from requirements
    - Implement category multi-select
    - Display read-only audit fields
    - Add Preview button (disabled for new records)
    - _Requirements: 3.8, 3.9, 18.1, 18.3_

  - [x] 12.3 Implement tool save logic
    - 🧠 **Use Sequential Thinking MCP** for save transaction logic
    - 🗄️ **Use Supabase MCP** to verify search_vector and junction table updates
    - Auto-generate search_vector on save
    - Sync tool_categories junction table
    - _Requirements: 3.10, 3.11_

  - [x] 12.4 Implement soft delete for tools
    - 🧠 **Use Sequential Thinking MCP** for soft delete state machine
    - 🗄️ **Use Supabase MCP** to verify status changes
    - 🎭 **Use Playwright MCP** to verify archived tool display
    - Change status to "archived" on delete
    - Display archived tools with gray background
    - Add Restore and Permanently Delete actions
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_

  - [x] 12.5 Implement duplicate detection
    - 🧠 **Use Sequential Thinking MCP** for fuzzy matching algorithm
    - 🗄️ **Use Supabase MCP** to verify duplicate queries
    - 🎭 **Use Playwright MCP** to verify warning dialog
    - Check for similar names (fuzzy match > 80%)
    - Check for same website_url
    - Display warning with links to existing records
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_

  - [x] 12.6 Write property tests for tools management
    - 🗄️ **Use Supabase MCP** to verify database operations
    - 🎭 **Use Playwright MCP** for UI verification
    - **Property 10: Search Vector Generation**
    - **Property 11: Junction Table Synchronization**
    - **Property 28: Preview Button State**
    - **Property 30: Soft Delete Lifecycle**
    - **Property 31: Archived Tool Display**
    - **Property 33: Duplicate Detection**
    - **Validates: Requirements 3.10, 3.11, 18.3, 19.2, 19.4, 19.5, 19.7, 21.1, 21.2, 21.3, 21.5**

- [x] 13. Checkpoint - Tools management complete
  - 🎭 **Use Playwright MCP** to run full tools CRUD flow tests
  - 🗄️ **Use Supabase MCP** to verify data integrity
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Implement Category Groups management
  - [x] 14.1 Create category groups repository methods
    - 🧠 **Use Sequential Thinking MCP** for repository design
    - 🗄️ **Use Supabase MCP** to verify CRUD operations
    - Add CRUD methods to `src/lib/db/repositories/categories.repository.ts` or create new file
    - Include category count computation
    - _Requirements: 4.1_

  - [x] 14.2 Create category groups list page
    - 🎭 **Use Playwright MCP** to verify list UI and drag-drop
    - 🗄️ **Use Supabase MCP** to verify data display
    - Create `src/app/admin/category-groups/page.tsx`
    - Implement columns: Name, Icon, Display Order, Category Count, Created Date
    - Implement drag-drop reordering
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 14.3 Create category groups form pages
    - 🎭 **Use Playwright MCP** to verify form interactions
    - Create `src/app/admin/category-groups/new/page.tsx`
    - Create `src/app/admin/category-groups/[id]/edit/page.tsx`
    - Implement fields: name, icon_name, display_order
    - _Requirements: 4.4_

  - [x] 14.4 Implement category group deletion prevention
    - 🧠 **Use Sequential Thinking MCP** for deletion logic
    - 🗄️ **Use Supabase MCP** to verify category relationships
    - 🎭 **Use Playwright MCP** to verify warning dialog
    - Check for assigned categories before delete
    - Display warning listing affected categories
    - Prevent deletion until categories reassigned
    - _Requirements: 4.5, 4.6, 4.7_

  - [x] 14.5 Write property tests for category groups
    - 🗄️ **Use Supabase MCP** to verify deletion prevention
    - 🎭 **Use Playwright MCP** for drag-drop testing
    - **Property 12: Drag-Drop Reordering** (partial)
    - **Property 13: Category Group Deletion Prevention**
    - **Validates: Requirements 4.2, 4.5, 4.7**

- [x] 15. Implement Categories management
  - [x] 15.1 Create categories list page
    - 🎭 **Use Playwright MCP** to verify list UI
    - 🗄️ **Use Supabase MCP** to verify category data
    - Create `src/app/admin/categories/page.tsx`
    - Implement columns: Name, Slug, Group Name, Tool Count, Display Order, Created Date
    - Implement filter by group_id
    - Implement drag-drop reordering within group
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 15.2 Create categories form pages
    - 🎭 **Use Playwright MCP** to verify form interactions
    - 🗄️ **Use Supabase MCP** to verify tool_count computation
    - Create `src/app/admin/categories/new/page.tsx`
    - Create `src/app/admin/categories/[id]/edit/page.tsx`
    - Implement all fields including group_id select
    - Display read-only tool_count
    - _Requirements: 5.5, 5.6_

  - [x] 15.3 Implement category cascade delete
    - 🧠 **Use Sequential Thinking MCP** for cascade delete logic
    - 🗄️ **Use Supabase MCP** to verify cascade operations
    - 🎭 **Use Playwright MCP** to verify warning dialog
    - Cascade delete subcategories and tool_categories entries
    - Display warning showing affected records
    - _Requirements: 5.7, 5.8_

  - [x] 15.4 Write property test for category cascade delete
    - 🗄️ **Use Supabase MCP** to verify cascade delete behavior
    - **Property 14: Category Cascade Delete**
    - **Validates: Requirements 5.7**

- [x] 16. Implement Subcategories management
  - [x] 16.1 Create subcategories list page
    - 🎭 **Use Playwright MCP** to verify list UI
    - 🗄️ **Use Supabase MCP** to verify subcategory data
    - Create `src/app/admin/subcategories/page.tsx`
    - Implement columns: Name, Slug, Parent Category, Tool Count, Display Order
    - Implement filter by category_id
    - Implement drag-drop reordering within parent
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 16.2 Create subcategories form pages
    - 🎭 **Use Playwright MCP** to verify form interactions
    - 🗄️ **Use Supabase MCP** to verify tool_count computation
    - Create `src/app/admin/subcategories/new/page.tsx`
    - Create `src/app/admin/subcategories/[id]/edit/page.tsx`
    - Implement all fields including category_id select (required)
    - Display read-only tool_count
    - _Requirements: 6.5, 6.6_

- [x] 17. Checkpoint - Taxonomy management complete
  - 🎭 **Use Playwright MCP** to run taxonomy CRUD flow tests
  - 🗄️ **Use Supabase MCP** to verify taxonomy data integrity
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Implement AI News management
  - [x] 18.1 Create AI News list page
    - 🎭 **Use Playwright MCP** to verify list UI
    - 🗄️ **Use Supabase MCP** to verify news data queries
    - Create `src/app/admin/news/page.tsx`
    - Implement columns: Title, Category, Published Status, Published Date, View Count
    - Implement filters: is_published, category
    - Implement sorting: published_at, view_count, created_at
    - Implement bulk actions: Publish, Unpublish, Delete
    - Add Preview row action
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 18.2 Create AI News form pages
    - 🧠 **Use Sequential Thinking MCP** for rich text integration
    - 🎭 **Use Playwright MCP** to verify form interactions
    - Create `src/app/admin/news/new/page.tsx`
    - Create `src/app/admin/news/[id]/edit/page.tsx`
    - Implement all fields including rich-text content
    - Display read-only analytics: view_count, like_count
    - Add Preview button
    - _Requirements: 7.6, 7.7, 18.2_

  - [x] 18.3 Implement publication timestamp logic
    - 🧠 **Use Sequential Thinking MCP** for timestamp logic
    - 🗄️ **Use Supabase MCP** to verify published_at updates
    - Auto-set published_at when is_published changes to true
    - _Requirements: 7.8_

  - [x] 18.4 Write property test for publication timestamp
    - 🗄️ **Use Supabase MCP** to verify timestamp behavior
    - **Property 15: Publication Timestamp**
    - **Validates: Requirements 7.8**

- [x] 19. Implement Prompts management
  - [x] 19.1 Create prompts list page
    - 🎭 **Use Playwright MCP** to verify list UI
    - 🗄️ **Use Supabase MCP** to verify prompts data
    - Create `src/app/admin/prompts/page.tsx`
    - Implement columns: Title, Type, Tags (truncated), View Count, Copy Count
    - Implement filter by type (sref/prompt)
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 19.2 Create prompts form pages
    - 🧠 **Use Sequential Thinking MCP** for conditional field logic
    - 🎭 **Use Playwright MCP** to verify conditional sref_code field
    - 🗄️ **Use Supabase MCP** to verify prompt data
    - Create `src/app/admin/prompts/new/page.tsx`
    - Create `src/app/admin/prompts/[id]/edit/page.tsx`
    - Implement all fields with conditional sref_code requirement
    - Display read-only analytics: view_count, copy_count
    - _Requirements: 8.4, 8.5, 8.6_

- [x] 20. Checkpoint - Content management complete
  - 🎭 **Use Playwright MCP** to run content CRUD flow tests
  - 🗄️ **Use Supabase MCP** to verify content data integrity
  - Ensure all tests pass, ask the user if questions arise.

- [x] 21. Implement Featured Tools management
  - [x] 21.1 Create featured tools list page
    - 🧠 **Use Sequential Thinking MCP** for status calculation logic
    - 🎭 **Use Playwright MCP** to verify list UI and status display
    - 🗄️ **Use Supabase MCP** to verify featured tools data
    - Create `src/app/admin/featured/page.tsx`
    - Implement columns: Tool Name, Placement, Sponsor, Date Range, Status, Impressions, Clicks
    - Implement filters: placement_type, is_sponsored, status
    - Calculate status from start_date/end_date
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 21.2 Create featured tools form pages
    - 🧠 **Use Sequential Thinking MCP** for conditional validation
    - 🎭 **Use Playwright MCP** to verify searchable select and conditional fields
    - 🗄️ **Use Supabase MCP** to verify tool lookup and analytics
    - Create `src/app/admin/featured/new/page.tsx`
    - Create `src/app/admin/featured/[id]/edit/page.tsx`
    - Implement searchable tool_id select
    - Implement conditional sponsor_name requirement
    - Display read-only analytics: impression_count, click_count
    - _Requirements: 10.5, 10.6, 10.7_

  - [x] 21.3 Write property test for featured tool status
    - 🗄️ **Use Supabase MCP** to verify status calculation
    - **Property 17: Featured Tool Status Calculation**
    - **Validates: Requirements 10.3**

- [x] 22. Implement FAQs management
  - [x] 22.1 Create FAQs list page
    - 🎭 **Use Playwright MCP** to verify list UI and drag-drop
    - 🗄️ **Use Supabase MCP** to verify FAQ data
    - Create `src/app/admin/faqs/page.tsx`
    - Implement columns: Question (truncated 80 chars), Category, Display Order
    - Implement filter by category
    - Implement drag-drop reordering
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 22.2 Create FAQs form pages
    - 🎭 **Use Playwright MCP** to verify rich text editor
    - 🗄️ **Use Supabase MCP** to verify FAQ data
    - Create `src/app/admin/faqs/new/page.tsx`
    - Create `src/app/admin/faqs/[id]/edit/page.tsx`
    - Implement all fields with rich-text answer
    - _Requirements: 9.5_

- [x] 23. Checkpoint - Features management complete
  - 🎭 **Use Playwright MCP** to run features CRUD flow tests
  - 🗄️ **Use Supabase MCP** to verify features data integrity
  - Ensure all tests pass, ask the user if questions arise.

- [x] 24. Implement Admins management
  - [x] 24.1 Create admins list page
    - 🧠 **Use Sequential Thinking MCP** for status badge logic
    - 🎭 **Use Playwright MCP** to verify list UI and status badges
    - 🗄️ **Use Supabase MCP** to verify admin data
    - Create `src/app/admin/admins/page.tsx`
    - Implement columns: Email, Status, Last Login, Failed Attempts, Created Date
    - Implement status badges: green=Active, gray=Inactive, red=Locked
    - Add row actions: Edit, Reset Password, Unlock, Delete
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 24.2 Create admins form pages
    - 🎭 **Use Playwright MCP** to verify form interactions
    - 🗄️ **Use Supabase MCP** to verify admin data
    - Create `src/app/admin/admins/new/page.tsx`
    - Create `src/app/admin/admins/[id]/edit/page.tsx`
    - Implement fields: email, password (create only), is_active
    - Display read-only fields: last_login_at, failed_login_attempts, locked_until
    - _Requirements: 11.4, 11.5_

  - [x] 24.3 Implement admin actions
    - 🧠 **Use Sequential Thinking MCP** for security logic
    - 🗄️ **Use Supabase MCP** to verify password hashing and unlock operations
    - 🎭 **Use Playwright MCP** to verify action dialogs
    - Hash password with bcrypt on create
    - Reset Password: generate new password and display once
    - Unlock: clear locked_until and reset failed_login_attempts
    - Prevent self-deletion
    - Prevent deactivating last active admin
    - _Requirements: 11.6, 11.7, 11.8, 11.9, 11.10_

  - [x] 24.4 Write property tests for admins management
    - 🗄️ **Use Supabase MCP** to verify password hashing and status
    - 🎭 **Use Playwright MCP** for status badge verification
    - **Property 18: Admin Status Badge**
    - **Property 19: Password Hashing**
    - **Validates: Requirements 11.2, 11.6**

- [x] 25. Implement User Activity view
  - [x] 25.1 Create user activity page
    - 🧠 **Use Sequential Thinking MCP** for aggregate statistics logic
    - 🎭 **Use Playwright MCP** to verify read-only UI
    - 🗄️ **Use Supabase MCP** to verify favorites data and aggregates
    - Create `src/app/admin/user-activity/page.tsx`
    - Implement read-only DataTable
    - Implement columns: User Email, Tool Name, Is Shortcut, Created Date
    - Implement filter by is_shortcut
    - Implement search by user_email, tool_name
    - Display aggregate statistics: Total Favorites, Total Shortcuts, Top 5 Most Favorited Tools
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 26. Implement Related Data Display
  - [x] 26.1 Add related data sections to forms
    - 🧠 **Use Sequential Thinking MCP** for related data query design
    - 🎭 **Use Playwright MCP** to verify collapsible sections
    - 🗄️ **Use Supabase MCP** to verify related data queries
    - Category form: show tools in category (limit 10, "View All" link)
    - Category Group form: show categories in group
    - Tool form: show assigned categories
    - Featured Tool form: show tool details
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

  - [x] 26.2 Write property test for related data display
    - 🗄️ **Use Supabase MCP** to verify related data limits
    - 🎭 **Use Playwright MCP** for UI verification
    - **Property 32: Related Data Display**
    - **Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5**

- [x] 27. Implement Preview functionality
  - [x] 27.1 Add preview routes and banner
    - 🧠 **Use Sequential Thinking MCP** for preview state logic
    - 🎭 **Use Playwright MCP** to verify preview pages and banner
    - Implement preview for tools: /tool/{slug}
    - Implement preview for news: /ai-news/{slug}
    - Add draft preview banner for unpublished records
    - _Requirements: 18.1, 18.2, 18.4_

  - [x] 27.2 Write property test for draft preview banner
    - 🎭 **Use Playwright MCP** to verify banner display
    - **Property 29: Draft Preview Banner**
    - **Validates: Requirements 18.4**

- [x] 28. Final checkpoint - All features complete
  - 🎭 **Use Playwright MCP** to run full end-to-end tests
  - 🗄️ **Use Supabase MCP** to verify complete data integrity
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript with Next.js App Router
- fast-check library is used for property-based testing with minimum 100 iterations

## Tool Legend

| Icon | Tool | When to Use |
|------|------|-------------|
| 🧠 | Sequential Thinking MCP | Complex logic, architecture decisions, multi-step algorithms |
| 🌐 | Web Browser MCP | Research libraries, documentation, best practices |
| 🎭 | Playwright MCP | UI verification, visual testing, interaction testing |
| 🗄️ | Supabase MCP | Database operations, schema verification, data validation |
