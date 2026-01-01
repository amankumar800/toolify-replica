# Design Document

## Overview

This design describes a simple social media links management feature for the admin panel. The feature allows administrators to edit URLs for four fixed social platforms (Twitter, LinkedIn, Facebook, Instagram) on a single page. The Footer component will dynamically fetch and display these links.

The design follows existing patterns in the codebase:
- Supabase for database storage
- Next.js API routes for backend
- React components for admin UI
- TypeScript throughout

## Architecture

```mermaid
flowchart TB
    subgraph Admin Panel
        AdminPage[Social Links Page]
        AdminSidebar[Admin Sidebar]
    end
    
    subgraph API Layer
        APIRoute[/api/admin/social-links]
    end
    
    subgraph Database
        SocialLinksTable[(social_links table)]
    end
    
    subgraph Frontend
        Footer[Footer Component]
        PublicAPI[/api/social-links]
    end
    
    AdminSidebar --> AdminPage
    AdminPage --> APIRoute
    APIRoute --> SocialLinksTable
    Footer --> PublicAPI
    PublicAPI --> SocialLinksTable
```

## Components and Interfaces

### Admin Sidebar Update

**File:** `src/components/admin/AdminSidebar.tsx`

Update the existing sidebar to add a new "Settings" navigation group with the Social Links item:

```typescript
// Add to navigation items array
{
  group: 'Settings',
  items: [
    {
      name: 'Social Links',
      href: '/admin/social-links',
      icon: Share2, // from lucide-react
    },
  ],
}
```

**Design Decision:** The "Settings" group is placed at the bottom of the sidebar navigation to separate configuration items from content management items. This follows common admin panel conventions where settings/configuration are typically found at the end of navigation.

### Admin Page Component

**File:** `src/app/admin/social-links/page.tsx`

A single page component that:
- Fetches current social link URLs on load
- Displays a form with 4 URL input fields (one per platform)
- Validates URLs on submit
- Saves all links via API call
- Shows success/error toast messages

```typescript
interface SocialLinksFormData {
  twitter_url: string;
  linkedin_url: string;
  facebook_url: string;
  instagram_url: string;
}
```

### API Routes

**Admin API:** `src/app/api/admin/social-links/route.ts`
- `GET` - Fetch all social links (admin only)
- `PUT` - Update all social links (admin only)

**Public API:** `src/app/api/social-links/route.ts`
- `GET` - Fetch active social links (public, for Footer)

### Footer Component Update

**File:** `src/components/layout/Footer.tsx`

Update to:
- Fetch social links from `/api/social-links` on mount
- Display only platforms with non-empty URLs
- Use existing icon components (Twitter, Linkedin, Facebook, Instagram from lucide-react)

## Data Models

### Database Table: `social_links`

```sql
CREATE TABLE social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL UNIQUE,
  url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with the 4 fixed platforms
INSERT INTO social_links (platform, url) VALUES
  ('twitter', ''),
  ('linkedin', ''),
  ('facebook', ''),
  ('instagram', '');
```

### TypeScript Types

```typescript
// Database row type
interface SocialLinkRow {
  id: string;
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
  url: string;
  created_at: string;
  updated_at: string;
}

// API response type for public endpoint
interface SocialLinksResponse {
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: URL Validation

*For any* string input, the URL validation function SHALL accept valid URLs (starting with http:// or https://) and empty strings, and SHALL reject all other strings.

**Validates: Requirements 1.4, 1.6, 1.7**

### Property 2: Data Round-Trip Consistency

*For any* set of valid social link URLs, saving the URLs via the API and then fetching them SHALL return the exact same URL values.

**Validates: Requirements 1.3, 1.5**

### Property 3: Footer Filtering

*For any* set of social links with mixed empty and non-empty URLs, the Footer component SHALL display exactly the platforms with non-empty URLs and hide platforms with empty URLs.

**Validates: Requirements 2.2**

### Property 4: Platform Icon Mapping

*For any* platform name in the set {twitter, linkedin, facebook, instagram}, the icon mapping function SHALL return the corresponding Lucide icon component.

**Validates: Requirements 2.4**

### Property 5: Sidebar Active State

*For any* current pathname, the Admin Sidebar SHALL highlight exactly the navigation item whose href matches the pathname (or is a prefix match for nested routes).

**Validates: Requirements 3.4**

## Error Handling

| Error Scenario | Handling |
|----------------|----------|
| Invalid URL format | Display validation error on the specific field |
| API fetch failure | Display error toast, keep form editable |
| API save failure | Display error toast, keep form data intact |
| Database connection error | Return 500 error from API |

## Testing Strategy

### Unit Tests
- URL validation function with valid URLs, invalid URLs, and empty strings
- Icon mapping function for all 4 platforms
- Form data transformation functions
- Sidebar navigation item configuration (Settings group exists, Social Links item present)

### Property-Based Tests
- **Property 1**: Generate random strings and verify URL validation behavior
- **Property 2**: Generate valid URL sets, save and load, verify equality
- **Property 3**: Generate social link sets with random empty/non-empty URLs, verify filtering
- **Property 4**: Test all platform names map to correct icons
- **Property 5**: Generate random pathnames and verify sidebar highlights correct item

### Integration Tests
- Admin page loads and displays form
- Form submission saves data correctly
- Footer fetches and displays links
- Sidebar navigation to Social Links page works correctly
- Social Links item shows active state when on /admin/social-links

### Testing Framework
- Vitest for unit and property tests
- fast-check for property-based testing (already used in codebase)
- Minimum 100 iterations per property test
