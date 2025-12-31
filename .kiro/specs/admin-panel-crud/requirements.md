# Requirements Document

## Introduction

This document defines the requirements for a comprehensive admin panel that provides full CRUD (Create, Read, Update, Delete) operations for all 11 database tables in the AI Tools Book application. The admin panel will enable administrators to manage all content, taxonomy, features, and system settings through a unified, consistent interface with detailed field-level control.

## Current State Analysis

### Existing Admin Pages
- `/admin/dashboard` - ✅ EXISTS (shows stats for tools, categories, news; recent tools table)
- `/admin/tools` - ✅ EXISTS (list view with basic table)
- `/admin/tools/new` - ✅ EXISTS (create form using ToolForm component)
- `/admin/prompts` - ❌ 404 NOT FOUND (link exists but page missing)

### Existing Infrastructure
- All 11 database repositories exist in `src/lib/db/repositories/`
- Admin authentication service working (`admin-auth.service.ts`)
- Base repository pattern established (`base.repository.ts`)
- ToolForm component exists (`src/components/admin/ToolForm.tsx`)

### Pages to Create (9 new sections)
1. `/admin/news` - AI News management
2. `/admin/prompts` - Midjourney Prompts management
3. `/admin/category-groups` - Category Groups management
4. `/admin/categories` - Categories management
5. `/admin/subcategories` - Subcategories management
6. `/admin/featured` - Featured Tools management
7. `/admin/faqs` - FAQs management
8. `/admin/admins` - Admin users management
9. `/admin/user-activity` - User favorites view (read-only)

## Glossary

- **Admin_Panel**: The administrative interface for managing all database content
- **CRUD**: Create, Read, Update, Delete operations
- **Data_Table**: A reusable component for displaying paginated, sortable, filterable lists
- **Form_Builder**: A system for generating consistent forms across all admin sections
- **Taxonomy**: The hierarchical organization of content (Category Groups → Categories → Subcategories)
- **Junction_Table**: A table that links two other tables (tool_categories links tools to categories)
- **Bulk_Action**: An operation performed on multiple selected records simultaneously
- **Computed_Field**: A field whose value is automatically calculated (e.g., tool_count)
- **Audit_Trail**: Timestamps showing when records were created and last updated

## Database Tables Overview

| Table | Purpose | Admin Access |
|-------|---------|--------------|
| tools | AI tool listings | Full CRUD |
| categories | Tool categories | Full CRUD |
| category_groups | Category groupings | Full CRUD |
| subcategories | Category subdivisions | Full CRUD |
| tool_categories | Tool-category links | Managed via Tools form |
| ai_news | News articles | Full CRUD |
| midjourney_prompts | Creative prompts | Full CRUD |
| faqs | FAQ entries | Full CRUD |
| featured_tools | Promoted tools | Full CRUD |
| user_favorites | User bookmarks | Read-only |
| admins | Admin accounts | Full CRUD |

## Requirements

### Requirement 1: Admin Navigation Sidebar

**User Story:** As an administrator, I want an organized navigation sidebar, so that I can easily access all admin sections.

#### Acceptance Criteria

1. WHEN the Admin_Panel loads, THE Admin_Sidebar SHALL display the following navigation groups and items:
   - **Overview**: Dashboard
   - **Content**: Tools, AI News, Prompts
   - **Taxonomy**: Category Groups, Categories, Subcategories
   - **Features**: Featured Tools, FAQs
   - **System**: Admins, User Activity
2. WHEN a navigation item is clicked, THE Admin_Sidebar SHALL navigate to the corresponding route:
   - Dashboard → /admin/dashboard
   - Tools → /admin/tools
   - AI News → /admin/news
   - Prompts → /admin/prompts
   - Category Groups → /admin/category-groups
   - Categories → /admin/categories
   - Subcategories → /admin/subcategories
   - Featured Tools → /admin/featured
   - FAQs → /admin/faqs
   - Admins → /admin/admins
   - User Activity → /admin/user-activity
3. WHILE a route is active, THE Admin_Sidebar SHALL highlight the corresponding navigation item
4. WHEN the Admin_Sidebar renders, THE Admin_Sidebar SHALL display an icon for each navigation item
5. WHILE the viewport width is less than 768px, THE Admin_Sidebar SHALL collapse to a hamburger menu
6. WHEN the Admin_Sidebar renders, THE Admin_Sidebar SHALL display the logged-in admin's email
7. WHEN the Sign Out button is clicked, THE System SHALL trigger the logout flow

### Requirement 2: Enhanced Dashboard

**User Story:** As an administrator, I want to see comprehensive statistics and quick actions on the dashboard, so that I can monitor platform health and access common tasks quickly.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Dashboard SHALL display stat cards for all tables:
   - Total Tools (from tools table)
   - Total Categories (from categories table)
   - Total Category Groups (from category_groups table)
   - Total Subcategories (from subcategories table)
   - Total AI News (from ai_news table)
   - Total Prompts (from midjourney_prompts table)
   - Total FAQs (from faqs table)
   - Active Featured Tools (from featured_tools where dates are current)
   - Total Admins (from admins table)
2. WHEN a stat card is clicked, THE Dashboard SHALL navigate to the corresponding management section
3. WHEN the Dashboard loads, THE Dashboard SHALL display a "Recent Activity" section showing the 10 most recently created/updated records across: tools, ai_news, midjourney_prompts
4. WHEN the Dashboard loads, THE Dashboard SHALL provide quick action buttons: "Add Tool", "Add News", "Add Prompt", "Add FAQ"
5. WHEN a quick action button is clicked, THE Dashboard SHALL navigate to the corresponding create form

### Requirement 3: Tools Management

**User Story:** As an administrator, I want to manage AI tools with full CRUD operations, so that I can maintain the tools directory.

#### Acceptance Criteria

**List View (GET /admin/tools):**
1. WHEN the Tools_List loads, THE Tools_List SHALL display a data table with columns: Name, Slug, Status, Pricing, Is Featured, Created Date
2. WHEN the Tools_List loads, THE Tools_List SHALL support pagination with 20 items per page
3. WHEN a column header is clicked, THE Tools_List SHALL support sorting by: Name, Created Date, Status
4. WHEN a search query is entered, THE Tools_List SHALL support searching by: name, slug, description
5. WHEN a filter is applied, THE Tools_List SHALL support filtering by: status (draft/pending/published/rejected), is_featured, pricing
6. WHEN a row is displayed, THE Tools_List SHALL display row actions: Edit, Delete
7. WHEN rows are selected, THE Tools_List SHALL support bulk selection with actions: Publish, Unpublish, Delete

**Create/Edit Form (GET /admin/tools/new, GET /admin/tools/[id]/edit):**
8. THE Tool_Form SHALL include the following fields:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | text | Yes | 2-100 characters |
| slug | text | Yes | Unique, lowercase, hyphens only |
| website_url | url | Yes | Valid URL format |
| description | rich-text | No | Max 5000 characters |
| short_description | textarea | No | Max 300 characters |
| image_url | image-upload | No | jpg/png/webp, max 5MB |
| pricing | select | No | Options: free, freemium, paid, contact |
| status | select | No | Options: draft, pending, published, rejected |
| is_featured | checkbox | No | Default: false |
| is_new | checkbox | No | Default: false |
| verified | checkbox | No | Default: false |
| tags | tag-input | No | Array of strings |
| categories | multi-select | No | Select from categories table |
| monthly_visits | number | No | Min: 0 |
| review_score | number | No | 0-5, decimal |
| review_count | number | No | Min: 0 |
| metadata | json-editor | No | Valid JSON |
| submitter_name | text | No | For submissions |
| submitter_email | email | No | Valid email format |
| rejection_reason | textarea | No | For rejected tools |

9. WHEN editing an existing tool, THE Tool_Form SHALL display read-only audit fields: created_at, updated_at
10. WHEN saving a tool, THE System SHALL auto-generate the search_vector field
11. WHEN saving a tool with categories, THE System SHALL update the tool_categories junction table

### Requirement 4: Category Groups Management

**User Story:** As an administrator, I want to manage category groups, so that I can organize categories into logical groupings.

#### Acceptance Criteria

**List View (GET /admin/category-groups):**
1. WHEN the Category_Groups_List loads, THE Category_Groups_List SHALL display columns: Name, Icon, Display Order, Category Count, Created Date
2. WHEN an admin drags and drops a row, THE Category_Groups_List SHALL update the display_order accordingly
3. WHEN a row is displayed, THE Category_Groups_List SHALL display row actions: Edit, Delete

**Create/Edit Form:**
4. THE Category_Group_Form SHALL include fields:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | text | Yes | 2-50 characters, unique |
| icon_name | icon-picker | No | Valid icon name |
| display_order | number | No | Auto-increment on create |

5. WHEN deleting a category group, THEN THE System SHALL check for assigned categories
6. IF categories exist in the group, THEN THE System SHALL display a warning listing affected categories
7. WHILE categories are assigned to the group, THE System SHALL prevent deletion until categories are reassigned or deleted

### Requirement 5: Categories Management

**User Story:** As an administrator, I want to manage categories with their relationships to groups, so that I can organize the tool taxonomy.

#### Acceptance Criteria

**List View (GET /admin/categories):**
1. WHEN the Categories_List loads, THE Categories_List SHALL display columns: Name, Slug, Group Name, Tool Count, Display Order, Created Date
2. WHEN a filter is applied, THE Categories_List SHALL support filtering by: group_id
3. WHEN an admin drags and drops a row within a group, THE Categories_List SHALL update the display_order accordingly
4. WHEN a row is displayed, THE Categories_List SHALL display row actions: Edit, Delete

**Create/Edit Form:**
5. THE Category_Form SHALL include fields:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | text | Yes | 2-100 characters |
| slug | text | Yes | Unique, lowercase, hyphens only |
| description | textarea | No | Max 500 characters |
| icon | icon-picker | No | Valid icon name |
| group_id | select | No | Select from category_groups |
| display_order | number | No | Auto-increment on create |
| metadata | json-editor | No | Valid JSON |

6. WHEN editing an existing category, THE Category_Form SHALL display read-only field: tool_count (computed)
7. WHEN deleting a category, THE System SHALL cascade delete: subcategories, tool_categories entries
8. WHEN a delete action is initiated, THE System SHALL display a warning showing affected records before deletion

### Requirement 6: Subcategories Management

**User Story:** As an administrator, I want to manage subcategories under categories, so that I can create a detailed taxonomy.

#### Acceptance Criteria

**List View (GET /admin/subcategories):**
1. WHEN the Subcategories_List loads, THE Subcategories_List SHALL display columns: Name, Slug, Parent Category, Tool Count, Display Order
2. WHEN a filter is applied, THE Subcategories_List SHALL support filtering by: category_id
3. WHEN an admin drags and drops a row within a parent category, THE Subcategories_List SHALL update the display_order accordingly
4. WHEN a row is displayed, THE Subcategories_List SHALL display row actions: Edit, Delete

**Create/Edit Form:**
5. THE Subcategory_Form SHALL include fields:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | text | Yes | 2-100 characters |
| slug | text | Yes | Unique within parent category |
| category_id | select | Yes | Select from categories |
| display_order | number | No | Auto-increment on create |

6. WHEN editing an existing subcategory, THE Subcategory_Form SHALL display read-only field: tool_count (computed)

### Requirement 7: AI News Management

**User Story:** As an administrator, I want to manage AI news articles, so that I can keep users informed about AI developments.

#### Acceptance Criteria

**List View (GET /admin/news):**
1. WHEN the AI_News_List loads, THE AI_News_List SHALL display columns: Title, Category, Published Status, Published Date, View Count
2. WHEN a filter is applied, THE AI_News_List SHALL support filtering by: is_published, category
3. WHEN a column header is clicked, THE AI_News_List SHALL support sorting by: published_at, view_count, created_at
4. WHEN rows are selected, THE AI_News_List SHALL support bulk actions: Publish, Unpublish, Delete
5. WHEN a row is displayed, THE AI_News_List SHALL display row actions: Edit, Delete, Preview

**Create/Edit Form:**
6. THE AI_News_Form SHALL include fields:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| title | text | Yes | 5-200 characters |
| slug | text | Yes | Unique, lowercase, hyphens only |
| content | rich-text | No | Max 50000 characters |
| summary | textarea | No | Max 500 characters |
| author_name | text | No | Max 100 characters |
| author_avatar | image-upload | No | jpg/png/webp, max 2MB |
| source_name | text | No | Max 100 characters |
| source_url | url | No | Valid URL format |
| category | select | No | Options: AI Research, Industry News, Product Launch, Tutorial, Opinion |
| tags | tag-input | No | Array of strings |
| is_published | toggle | No | Default: false |
| published_at | datetime | No | Auto-set when publishing |
| priority_score | number | No | 0-100 |

7. WHEN editing an existing news item, THE AI_News_Form SHALL display read-only analytics: view_count, like_count
8. WHEN is_published changes from false to true, THE System SHALL set published_at to current timestamp

### Requirement 8: Midjourney Prompts Management

**User Story:** As an administrator, I want to manage Midjourney prompts and SREF codes, so that users can discover creative prompts.

#### Acceptance Criteria

**List View (GET /admin/prompts):**
1. WHEN the Prompts_List loads, THE Prompts_List SHALL display columns: Title, Type, Tags (truncated), View Count, Copy Count
2. WHEN a filter is applied, THE Prompts_List SHALL support filtering by: type (sref/prompt)
3. WHEN a row is displayed, THE Prompts_List SHALL display row actions: Edit, Delete

**Create/Edit Form:**
4. THE Prompt_Form SHALL include fields:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| title | text | Yes | 5-200 characters |
| slug | text | Yes | Unique, lowercase, hyphens only |
| type | select | Yes | Options: sref, prompt |
| prompt_text | textarea | No | Max 2000 characters |
| sref_code | text | No | Required if type=sref |
| image_url | image-upload | No | jpg/png/webp, max 5MB |
| tags | tag-input | No | Array of strings |

5. WHEN editing an existing prompt, THE Prompt_Form SHALL display read-only analytics: view_count, copy_count
6. WHEN type is "sref", THE System SHALL require sref_code field

### Requirement 9: FAQs Management

**User Story:** As an administrator, I want to manage FAQ entries, so that users can find answers to common questions.

#### Acceptance Criteria

**List View (GET /admin/faqs):**
1. WHEN the FAQs_List loads, THE FAQs_List SHALL display columns: Question (truncated to 80 chars), Category, Display Order
2. WHEN a filter is applied, THE FAQs_List SHALL support filtering by: category
3. WHEN an admin drags and drops a row, THE FAQs_List SHALL update the display_order accordingly
4. WHEN a row is displayed, THE FAQs_List SHALL display row actions: Edit, Delete

**Create/Edit Form:**
5. THE FAQ_Form SHALL include fields:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| question | text | Yes | 10-500 characters |
| answer | rich-text | Yes | Max 5000 characters |
| category | select | No | Options: General, Tools, Account, Technical |
| display_order | number | No | Auto-increment on create |

### Requirement 10: Featured Tools Management

**User Story:** As an administrator, I want to manage featured and sponsored tool placements, so that I can highlight and monetize tool listings.

#### Acceptance Criteria

**List View (GET /admin/featured):**
1. WHEN the Featured_Tools_List loads, THE Featured_Tools_List SHALL display columns: Tool Name, Placement, Sponsor, Date Range, Status (Active/Expired/Scheduled), Impressions, Clicks
2. WHEN a filter is applied, THE Featured_Tools_List SHALL support filtering by: placement_type, is_sponsored, status (active/expired/scheduled)
3. WHEN displaying a featured tool, THE Featured_Tools_List SHALL calculate status based on start_date and end_date
4. WHEN a row is displayed, THE Featured_Tools_List SHALL display row actions: Edit, Delete

**Create/Edit Form:**
5. THE Featured_Tool_Form SHALL include fields:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| tool_id | searchable-select | Yes | Select from tools table |
| placement_type | select | No | Options: homepage, category, search |
| is_sponsored | checkbox | No | Default: false |
| sponsor_name | text | No | Required if is_sponsored=true |
| campaign_id | text | No | For tracking |
| start_date | date | No | Default: today |
| end_date | date | No | Must be >= start_date |
| display_order | number | No | For ordering within placement |

6. WHEN editing an existing featured tool, THE Featured_Tool_Form SHALL display read-only analytics: impression_count, click_count
7. WHEN is_sponsored is true, THE System SHALL require sponsor_name

### Requirement 11: Admins Management

**User Story:** As an administrator, I want to manage admin user accounts, so that I can control access to the admin panel.

#### Acceptance Criteria

**List View (GET /admin/admins):**
1. WHEN the Admins_List loads, THE Admins_List SHALL display columns: Email, Status (Active/Inactive/Locked), Last Login, Failed Attempts, Created Date
2. WHEN displaying an admin row, THE Admins_List SHALL display status badges: green=Active, gray=Inactive, red=Locked
3. WHEN a row is displayed, THE Admins_List SHALL display row actions: Edit, Reset Password, Unlock (if locked), Delete

**Create/Edit Form:**
4. THE Admin_Form SHALL include fields:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | email | Yes | Valid email, unique |
| password | password | Yes (create only) | Min 8 chars, 1 uppercase, 1 number, 1 special |
| is_active | toggle | No | Default: true |

5. WHEN editing an existing admin, THE Admin_Form SHALL display read-only fields: last_login_at, failed_login_attempts, locked_until
6. WHEN creating an admin, THE System SHALL hash the password using bcrypt
7. WHEN the "Reset Password" action is triggered, THE System SHALL generate a new password and display it once
8. WHEN the "Unlock" action is triggered, THE System SHALL clear locked_until and reset failed_login_attempts to 0
9. IF an admin attempts to delete their own account, THEN THE System SHALL prevent the deletion
10. IF only one active admin remains, THEN THE System SHALL prevent deactivating that admin

### Requirement 12: User Activity View (Read-Only)

**User Story:** As an administrator, I want to view user favorites data, so that I can understand user engagement patterns.

#### Acceptance Criteria

1. WHEN the User_Activity_List loads, THE User_Activity_List SHALL display columns: User Email, Tool Name, Is Shortcut, Created Date
2. WHEN the User_Activity_List loads, THE User_Activity_List SHALL be read-only (no create/edit/delete actions)
3. WHEN a filter is applied, THE User_Activity_List SHALL support filtering by: is_shortcut
4. WHEN a search query is entered, THE User_Activity_List SHALL support searching by: user_email, tool_name
5. WHEN the User_Activity_List loads, THE User_Activity_List SHALL display aggregate statistics at the top:
   - Total Favorites count
   - Total Shortcuts count
   - Top 5 Most Favorited Tools

### Requirement 13: Reusable Admin Components

**User Story:** As a developer, I want reusable admin components, so that all admin sections have consistent UI/UX.

#### Acceptance Criteria

1. WHEN rendered, THE Data_Table component SHALL support:
   - Pagination (configurable items per page: 10, 20, 50)
   - Column sorting (ascending/descending)
   - Global search
   - Column-specific filters
   - Row selection (checkbox)
   - Custom cell renderers
   - Loading state
   - Empty state
   - Row actions dropdown

2. WHEN rendered, THE Form components SHALL support field types:
   - text (with character counter)
   - textarea (with character counter)
   - number (with min/max)
   - email (with validation)
   - password (with strength indicator)
   - url (with validation)
   - select (single selection)
   - multi-select (multiple selection)
   - searchable-select (with async search)
   - checkbox
   - toggle
   - date
   - datetime
   - rich-text (WYSIWYG editor)
   - image-upload (with preview, drag-drop)
   - tag-input (with autocomplete)
   - json-editor (with syntax highlighting)
   - icon-picker

3. WHEN displayed, THE Delete_Modal component SHALL:
   - Display the record name/identifier
   - Show affected related records (cascade deletes)
   - Require typing "DELETE" for critical operations
   - Provide Cancel and Confirm buttons

4. WHEN items are selected, THE Bulk_Actions component SHALL:
   - Display selected count
   - Show available actions as buttons
   - Confirm before executing destructive actions

5. WHEN a form has unsaved changes and the admin attempts to navigate away, THEN THE System SHALL display a warning dialog

6. WHEN rendered, THE Admin_Layout SHALL provide:
   - Consistent header with search and user menu
   - Responsive sidebar navigation
   - Breadcrumb navigation
   - Toast notifications for success/error messages


### Requirement 14: Form Validation & Error Handling

**User Story:** As an administrator, I want clear validation feedback, so that I can correct errors before submitting forms.

#### Acceptance Criteria

1. WHEN a field loses focus, THEN THE System SHALL perform client-side validation
2. WHEN a form is submitted, THEN THE System SHALL perform server-side validation
3. WHEN a field fails validation, THEN THE System SHALL display an inline error message below the field
4. WHILE a field has validation errors, THE System SHALL highlight it with a red border
5. WHEN a server error occurs, THEN THE System SHALL display a toast notification with the error message
6. WHEN a unique constraint is violated, THEN THE System SHALL display a specific message (e.g., "A tool with this slug already exists")
7. WHEN a form is submitted successfully, THEN THE System SHALL display a success toast and redirect to the list view
8. WHILE validation errors exist, THE System SHALL prevent form submission
9. WHEN a required field is empty, THEN THE System SHALL display "This field is required"
10. THE System SHALL validate URL fields match the pattern: https?://...

### Requirement 15: Loading States & User Feedback

**User Story:** As an administrator, I want visual feedback during operations, so that I know the system is responding.

#### Acceptance Criteria

1. WHILE a data table is loading, THE System SHALL display a skeleton loader
2. WHILE a form is submitting, THE System SHALL disable the submit button and show a spinner
3. WHILE a delete operation is in progress, THE System SHALL show a loading state in the modal
4. WHILE navigating between pages, THE System SHALL show a top progress bar
5. WHILE a bulk action is processing, THE System SHALL show progress (e.g., "Deleting 3 of 10...")
6. THE System SHALL display toast notifications with the following styles:
   - Success: Green background, checkmark icon
   - Error: Red background, X icon
   - Warning: Yellow background, warning icon
   - Info: Blue background, info icon
7. WHEN 5 seconds have elapsed, THEN THE Toast_Notification SHALL auto-dismiss
8. WHEN the X button is clicked, THEN THE Toast_Notification SHALL dismiss immediately

### Requirement 16: Global Search

**User Story:** As an administrator, I want to search across all content from the header, so that I can quickly find any record.

#### Acceptance Criteria

1. WHEN a search query is entered, THE Global_Search SHALL search across: tools (name, slug), ai_news (title), midjourney_prompts (title), categories (name), faqs (question)
2. WHEN the admin types in the search box, THE System SHALL show results after 300ms debounce
3. WHEN displaying results, THE Search_Results SHALL display up to 5 results per content type
4. WHEN displaying results, THE Search_Results SHALL show the content type label for each result
5. WHEN a search result is clicked, THE System SHALL navigate to the edit page for that record
6. WHEN no results are found, THE System SHALL display "No results found"
7. WHEN displaying results, THE Search_Results SHALL highlight the matching text
8. WHEN the admin presses Escape, THE System SHALL close the search results dropdown

### Requirement 17: Data Export

**User Story:** As an administrator, I want to export data to CSV, so that I can analyze data externally or create backups.

#### Acceptance Criteria

1. WHEN a list view loads, THE list view SHALL have an "Export CSV" button
2. WHEN exporting, THE Export SHALL include all visible columns plus id and timestamps
3. WHEN exporting, THE Export SHALL respect current filters (export filtered data)
4. WHEN exporting, THE Export SHALL include a maximum of 10,000 records
5. IF more than 10,000 records exist, THEN THE System SHALL display a warning
6. WHEN exporting, THE CSV filename SHALL follow the pattern: {table_name}_{date}.csv
7. WHEN exporting, THE Export SHALL handle special characters and newlines in content fields

### Requirement 18: Preview Functionality

**User Story:** As an administrator, I want to preview content before publishing, so that I can verify how it will appear to users.

#### Acceptance Criteria

1. WHEN the Preview button is clicked on a Tool_Form, THE System SHALL open /tool/{slug} in a new tab
2. WHEN the Preview button is clicked on an AI_News_Form, THE System SHALL open /ai-news/{slug} in a new tab
3. WHILE the record is unsaved (new), THE Preview button SHALL be disabled
4. IF the record is not published, THEN THE Preview page SHALL show a draft preview banner

### Requirement 19: Soft Delete for Tools

**User Story:** As an administrator, I want to archive tools instead of permanently deleting them, so that I can recover accidentally deleted content.

#### Acceptance Criteria

1. THE Tool status options SHALL include: draft, pending, published, rejected, archived
2. WHEN an admin clicks "Delete" on a tool, THEN THE System SHALL change status to "archived" (soft delete)
3. THE Tools_List SHALL have a filter option to show/hide archived tools
4. WHILE a tool is archived, THE Tools_List SHALL display it with a gray background
5. WHEN the "Restore" action is triggered on an archived tool, THEN THE System SHALL change status to "draft"
6. WHEN the "Permanently Delete" action is triggered, THEN THE System SHALL require confirmation before deletion
7. WHILE a tool has status "archived", THE Public_Website SHALL NOT display it

### Requirement 20: Related Data Display

**User Story:** As an administrator, I want to see related records when viewing/editing, so that I can understand data relationships.

#### Acceptance Criteria

1. WHEN viewing a Category, THEN THE System SHALL display a list of tools in that category
2. WHEN viewing a Category Group, THEN THE System SHALL display a list of categories in that group
3. WHEN viewing a Tool, THEN THE System SHALL display its assigned categories
4. WHEN viewing a Featured Tool, THEN THE System SHALL display the tool details
5. THE Related_Data_List SHALL be limited to 10 items with a "View All" link
6. THE Related_Data section SHALL be displayed in a collapsible section below the form

### Requirement 21: Duplicate Detection

**User Story:** As an administrator, I want to be warned about potential duplicates, so that I can avoid creating redundant content.

#### Acceptance Criteria

1. WHEN creating a new tool, THEN THE System SHALL check for existing tools with similar names (fuzzy match > 80%)
2. WHEN creating a new tool, THEN THE System SHALL check for existing tools with the same website_url
3. IF potential duplicates are found, THEN THE System SHALL display a warning with links to the existing records
4. THE Warning_Dialog SHALL allow the admin to proceed or cancel
5. THE Duplicate_Detection SHALL NOT block creation, only warn

### Requirement 22: Responsive Design

**User Story:** As an administrator, I want to use the admin panel on mobile devices, so that I can manage content on the go.

#### Acceptance Criteria

1. WHILE the viewport width is less than 768px, THE Admin_Sidebar SHALL collapse to a hamburger menu
2. WHILE the viewport width is less than 768px, THE Data_Table SHALL be horizontally scrollable
3. WHILE the viewport width is less than 640px, THE Forms SHALL stack fields vertically
4. WHILE on mobile devices, THE Action_Buttons SHALL be accessible via a dropdown menu
5. WHILE the viewport width is less than 768px, THE Dashboard stat cards SHALL stack in a single column
6. THE Touch_Targets SHALL be at least 44x44 pixels for mobile accessibility
