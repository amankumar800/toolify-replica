# Design Document

## Overview

This design describes the Company Pages Management feature, which enables administrators to manage content for internal company information pages (About Us, Contact, Privacy Policy, Terms of Service) and adds external link management (Community, Help Center) to the existing Social Links page.

The feature consists of:
1. A new admin page for viewing and editing company page content
2. Frontend pages to display company information to visitors
3. Footer updates to show company page links and external resource links
4. Extension of the Social Links page to include external links

The design follows existing patterns in the codebase:
- Supabase for database storage
- Next.js API routes for backend
- React components for admin UI
- TypeScript throughout
- Rich text editing for content

## Architecture

```mermaid
flowchart TB
    subgraph Admin Panel
        CompanyPagesListPage[Company Pages List]
        CompanyPageEditPage[Company Page Edit]
        SocialLinksPage[Social Links Page]
        AdminSidebar[Admin Sidebar]
    end
    
    subgraph API Layer
        CompanyPagesAPI[/api/admin/company-pages]
        SocialLinksAPI[/api/admin/social-links]
    end
    
    subgraph Database
        CompanyPagesTable[(company_pages table)]
        SocialLinksTable[(social_links table)]
    end
    
    subgraph Frontend
        AboutPage[/about]
        ContactPage[/contact]
        PrivacyPage[/privacy]
        TermsPage[/terms]
        Footer[Footer Component]
    end
    
    AdminSidebar --> CompanyPagesListPage
    CompanyPagesListPage --> CompanyPageEditPage
    CompanyPagesListPage --> CompanyPagesAPI
    CompanyPageEditPage --> CompanyPagesAPI
    SocialLinksPage --> SocialLinksAPI
    
    CompanyPagesAPI --> CompanyPagesTable
    SocialLinksAPI --> SocialLinksTable
    
    AboutPage --> CompanyPagesTable
    ContactPage --> CompanyPagesTable
    PrivacyPage --> CompanyPagesTable
    TermsPage --> CompanyPagesTable
    Footer --> CompanyPagesTable
    Footer --> SocialLinksTable
```

## Components and Interfaces

### Admin Sidebar Update

**File:** `src/components/admin/AdminSidebar.tsx`

Add "Company Pages" item to the existing Settings group:

```typescript
// Update Settings group in navGroups array
{
  label: 'Settings',
  items: [
    { label: 'Social Links', href: '/admin/social-links', icon: Share2 },
    { label: 'Company Pages', href: '/admin/company-pages', icon: FileText },
  ],
}
```

### Company Pages List Page

**File:** `src/app/admin/company-pages/page.tsx`

A page component that:
- Fetches all company pages on load
- Displays a list with title, last updated date, and Edit button
- Navigates to edit page when Edit is clicked

```typescript
interface CompanyPageListItem {
  id: string;
  slug: string;
  title: string;
  updated_at: string;
}
```

### Company Page Edit Page

**File:** `src/app/admin/company-pages/[slug]/edit/page.tsx`

A page component that:
- Fetches the specific company page content by slug
- Displays a form with title (text input) and content (rich text editor)
- Validates title is not empty on submit
- Saves content via API call
- Shows success/error toast messages

```typescript
interface CompanyPageFormData {
  title: string;
  content: string;
}
```

### Social Links Page Update

**File:** `src/app/admin/social-links/page.tsx`

Update to:
- Add two new URL fields: Community and Help Center
- Organize fields into two sections: "Social Media" and "External Links"
- Apply same URL validation to new fields

```typescript
// Extended form data type
interface SocialLinksFormData {
  twitter_url: string;
  linkedin_url: string;
  facebook_url: string;
  instagram_url: string;
  community_url: string;
  help_center_url: string;
}
```

### API Routes

**Company Pages Admin API:** `src/app/api/admin/company-pages/route.ts`
- `GET` - Fetch all company pages (admin only)

**Company Page Admin API:** `src/app/api/admin/company-pages/[slug]/route.ts`
- `GET` - Fetch single company page by slug (admin only)
- `PUT` - Update company page content (admin only)

### Frontend Pages

**About Page:** `src/app/(site)/about/page.tsx`
**Contact Page:** `src/app/(site)/contact/page.tsx`
**Privacy Page:** `src/app/(site)/privacy/page.tsx`
**Terms Page:** `src/app/(site)/terms/page.tsx`

Each page:
- Fetches content from database by slug
- Renders title and rich text content
- Shows placeholder if content is empty

### Footer Component Update

**File:** `src/components/layout/Footer.tsx`

Update to:
- Add "Company" section with links to About, Contact, Privacy, Terms
- Add "Resources" section with Community and Help Center links (when URLs are non-empty)
- Fetch external links from social_links table

## Data Models

### Database Table: `company_pages`

```sql
CREATE TABLE company_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with the 4 fixed pages
INSERT INTO company_pages (slug, title, content) VALUES
  ('about', 'About Us', ''),
  ('contact', 'Contact', ''),
  ('privacy', 'Privacy Policy', ''),
  ('terms', 'Terms of Service', '');
```

### Database Table Update: `social_links`

```sql
-- Add external link platforms
INSERT INTO social_links (platform, url) VALUES
  ('community', ''),
  ('help_center', '');
```

### TypeScript Types

```typescript
// Company page database row type
interface CompanyPageRow {
  id: string;
  slug: 'about' | 'contact' | 'privacy' | 'terms';
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Company page list item for admin
interface CompanyPageListItem {
  id: string;
  slug: string;
  title: string;
  updated_at: string;
}

// Company page form data
interface CompanyPageFormData {
  title: string;
  content: string;
}

// Extended social links form data
interface SocialLinksFormData {
  twitter_url: string;
  linkedin_url: string;
  facebook_url: string;
  instagram_url: string;
  community_url: string;
  help_center_url: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Company Page List Item Rendering

*For any* company page in the database, the list page SHALL render an item containing the page title, last updated date, and an edit button.

**Validates: Requirements 1.2, 1.3**

### Property 2: Edit Navigation

*For any* company page slug, clicking the Edit button SHALL navigate to `/admin/company-pages/{slug}/edit`.

**Validates: Requirements 1.4**

### Property 3: Form Pre-population Round-Trip

*For any* company page with saved content, loading the edit form SHALL display the exact same title and content values that were saved.

**Validates: Requirements 2.2**

### Property 4: Title Validation

*For any* title/content pair, validation SHALL pass if and only if the title is non-empty (after trimming whitespace). Empty content SHALL always be accepted.

**Validates: Requirements 2.4, 2.6, 2.7**

### Property 5: Content Display Round-Trip

*For any* company page slug, the content saved via the admin panel SHALL be displayed on the corresponding frontend page at `/{slug}`.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 6: Footer Company Link Navigation

*For any* company page link in the footer, clicking the link SHALL navigate to the correct internal page URL (`/about`, `/contact`, `/privacy`, `/terms`).

**Validates: Requirements 3.6**

### Property 7: Sidebar Active State

*For any* pathname starting with `/admin/company-pages`, the Admin Sidebar SHALL highlight the "Company Pages" navigation item as active.

**Validates: Requirements 4.3**

### Property 8: URL Validation Consistency

*For any* URL input field (social media or external links), the same validation rules SHALL apply: accept valid URLs (starting with http:// or https://) and empty strings, reject all other strings.

**Validates: Requirements 5.3**

### Property 9: External Links Round-Trip

*For any* set of valid external link URLs (Community, Help Center), saving the URLs via the API and then fetching them SHALL return the exact same URL values.

**Validates: Requirements 5.4**

### Property 10: Conditional External Link Display

*For any* external link (Community, Help Center), the Footer SHALL display the link if and only if the URL is non-empty.

**Validates: Requirements 5.5**

## Error Handling

| Error Scenario | Handling |
|----------------|----------|
| Empty title on save | Display validation error, prevent save |
| Invalid URL format | Display validation error on the specific field |
| API fetch failure | Display error toast, keep form editable |
| API save failure | Display error toast, keep form data intact |
| Database connection error | Return 500 error from API |
| Company page not found | Return 404 error from API |

## Testing Strategy

### Unit Tests
- Title validation function with empty, whitespace, and valid titles
- URL validation function with valid URLs, invalid URLs, and empty strings
- Company page slug validation
- Form data transformation functions

### Property-Based Tests
- **Property 1**: Generate random company page data, verify list item contains required elements
- **Property 3**: Generate valid title/content pairs, save and load, verify equality
- **Property 4**: Generate random strings for title, verify validation behavior
- **Property 5**: Generate valid content, save via API, fetch via frontend, verify equality
- **Property 7**: Generate random pathnames, verify sidebar highlights correct item
- **Property 8**: Generate random strings, verify URL validation consistency
- **Property 9**: Generate valid URL sets, save and load, verify equality
- **Property 10**: Generate external link sets with random empty/non-empty URLs, verify filtering

### Integration Tests
- Company pages list page loads and displays all four pages
- Edit page loads and displays form with pre-populated content
- Form submission saves data correctly
- Frontend pages fetch and display content
- Footer displays company page links
- Footer displays external links when URLs are non-empty
- Sidebar navigation to Company Pages works correctly
- Social Links page displays new external link fields

### Testing Framework
- Vitest for unit and property tests
- fast-check for property-based testing (already used in codebase)
- Minimum 100 iterations per property test
