# Vercel + Supabase Deployment Plan

> **Generated:** January 10, 2026  
> **Project:** AI Tools Book  
> **Architecture:** Next.js 16 (Vercel) + Supabase (Backend)  
> **Total Issues:** 18 (5 Critical, 6 High, 5 Medium, 2 Low)

---

## Executive Summary

Your project is **80% ready** for deployment. The architecture is solid with proper Supabase integration, but there are **3 remaining critical issues** that will cause deployment failure if not addressed.

### Current State
| Component | Status |
|-----------|--------|
| Database Schema | ✅ 18 tables with RLS enabled |
| Services Layer | ✅ Uses Supabase with `unstable_cache` |
| User Authentication | ✅ Supabase Auth properly implemented |
| Admin Authentication | ✅ Custom JWT with httpOnly cookies |
| Rate Limiting | ✅ Upstash Redis configured |
| Middleware | ✅ Session refresh + rate limiting |
| TypeScript Types | ✅ Auto-generated from Supabase |
| Homepage Data | ✅ Uses database queries (P0-2 complete) |
| Admin Service | ✅ Uses Supabase (P0-1 complete) |
| Database Population | ⚠️ Needs seeding (P0-3 pending) |

### Progress Summary
| Priority | Total | Completed | Remaining |
|----------|-------|-----------|-----------|
| 🔴 P0 Critical | 5 | 2 | 3 |
| 🟠 P1 High | 6 | 0 | 6 |
| 🟡 P2 Medium | 6 | 0 | 6 |
| 🟢 P3 Low | 2 | 0 | 2 |

---

## 🔴 P0 - CRITICAL (Deployment Blockers)

> **3 remaining issues MUST be fixed before deployment or the app WILL FAIL**


### ✅ P0-1: Remove Filesystem Database Dependency — COMPLETED

| Attribute | Value |
|-----------|-------|
| **File** | `src/app/admin/actions.ts` |
| **Status** | ✅ **DONE** |
| **Completed** | January 10, 2026 |

**What was done:**
- ✅ Updated imports in `src/app/admin/actions.ts` to use `tools.service.ts`
- ✅ Deleted `src/lib/services/admin.service.ts`
- ✅ Deleted `src/data/mock-db.json`
- ✅ Admin CRUD operations now use Supabase via `tools.service.ts`

---

### ✅ P0-2: Replace Homepage Static JSON with Database Queries — COMPLETED

| Attribute | Value |
|-----------|-------|
| **File** | `src/app/(site)/page.tsx` |
| **Status** | ✅ **DONE** |
| **Completed** | January 10, 2026 |

**What was done:**
- ✅ Created `src/lib/services/homepage.service.ts` with three cached functions:
  - `getFeaturedToolsForHomepage()` - 30min cache, queries `featured_tools` + `tools`
  - `getCategoriesForHomepage()` - 1hr cache, queries `categories` with real tool counts
  - `getMyToolsForHomepage()` - 1hr cache, returns popular tools (default for non-logged-in users)
- ✅ Updated `src/app/(site)/page.tsx` to use database queries
- ✅ Removed all static JSON imports
- ✅ Data validated with Zod schemas

**Implementation Details:**
```typescript
// src/app/(site)/page.tsx - NOW USES DATABASE
const [trendingNews, stats, featuredToolsData, categoriesData, myToolsData] = await Promise.all([
  NewsService.getTrendingNews(),
  getHomePageStats(),
  getFeaturedToolsForHomepage(),
  getCategoriesForHomepage(),
  getMyToolsForHomepage(),
]);
```

**Future Enhancement (P2):** Add user-specific favorites for logged-in users in `getMyToolsForHomepage()`

---

### P0-3: Populate Database with Production Data

| Attribute | Value |
|-----------|-------|
| **Tables** | `featured_tools`, `categories`, `ai_news` |
| **Impact** | 🚨 Homepage will be empty or show minimal data |
| **Time to Fix** | 1 hour |

**Current Gap:**
| Table | JSON Count | Database Count | Missing |
|-------|------------|----------------|---------|
| featured_tools | 16 | 2 | 14 |
| categories | 12 | 8 | 4 |
| ai_news | 10 | 3 | 7 |

**Solution - Migration SQL:**
```sql
-- Insert featured tools from JSON data
INSERT INTO featured_tools (tool_id, placement_type, display_order)
SELECT t.id, 'homepage', row_number() OVER ()
FROM tools t
WHERE t.slug IN (
  'evermemons', 'bananapro', 'blogseo', 'chatgpt', 'midjourney',
  'claude', 'jasper', 'copy-ai', 'writesonic', 'notion-ai',
  'grammarly', 'otter-ai', 'descript', 'runway', 'synthesia', 'heygen'
)
AND t.status = 'published'
ON CONFLICT DO NOTHING;

-- Update category tool counts
UPDATE categories SET tool_count = (
  SELECT COUNT(*) FROM tools 
  WHERE tools.category_id = categories.id 
  AND tools.status = 'published'
);
```

**Action Items:**
- [ ] Create migration script or run SQL directly
- [ ] Verify all 16 featured tools exist in `tools` table
- [ ] Add missing categories if needed
- [ ] Seed AI news articles
- [ ] Verify data appears on homepage

---

### P0-4: Add Missing Environment Variable

| Attribute | Value |
|-----------|-------|
| **Variable** | `NEXT_PUBLIC_SITE_URL` |
| **Impact** | ⚠️ Sitemap.xml, canonical URLs, and SEO may break |
| **Time to Fix** | 5 minutes |

**Problem:** Variable is used in code but not documented in `.env.example`.

**Solution:**
```bash
# Add to .env.example and Vercel
NEXT_PUBLIC_SITE_URL=https://aitoolsbook.com
```

**Action Items:**
- [ ] Add to `.env.example`
- [ ] Add to `.env` locally
- [ ] Add to Vercel environment variables

---

### P0-5: Verify Admin API Authentication

| Attribute | Value |
|-----------|-------|
| **Files** | All `src/app/api/admin/**/*.ts` routes |
| **Impact** | 🚨 **SECURITY VULNERABILITY** - Unauthorized access to admin functions |
| **Time to Fix** | 30 minutes |

**Requirement:** Every admin API route MUST call `requireAdmin()` at the start.

**Files to Verify:**
- [ ] `src/app/api/admin/tools/route.ts`
- [ ] `src/app/api/admin/tools/[id]/route.ts`
- [ ] `src/app/api/admin/categories/route.ts`
- [ ] `src/app/api/admin/categories/[id]/route.ts`
- [ ] `src/app/api/admin/news/route.ts`
- [ ] `src/app/api/admin/news/[id]/route.ts`
- [ ] `src/app/api/admin/featured/route.ts`
- [ ] Any other `/api/admin/**` routes

**Expected Pattern:**
```typescript
export async function POST(request: Request) {
  const admin = await requireAdmin();  // MUST be first line
  if (!admin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of handler
}
```

---

## 🟠 P1 - HIGH PRIORITY (Security & Configuration)

> **Fix these within Week 1 after deployment**


### P1-1: Fix Supabase Security Warnings (Mutable search_path)

| Attribute | Value |
|-----------|-------|
| **Location** | Supabase Database Functions |
| **Impact** | 🔒 Security vulnerability - search_path injection possible |
| **Time to Fix** | 30 minutes |

**Affected Functions:**
1. `immutable_to_tsvector`
2. `immutable_weighted_tsvector`
3. `tools_search_vector`
4. `update_updated_at_column`
5. `enforce_shortcut_limit`

**Solution - Add to each function:**
```sql
-- Example fix for update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;  -- ADD THIS LINE
```

**Action Items:**
- [ ] Run security advisor in Supabase Dashboard
- [ ] Update all 5 functions with `SET search_path = public`
- [ ] Re-run security advisor to verify fixes

---

### P1-2: Enable Leaked Password Protection

| Attribute | Value |
|-----------|-------|
| **Location** | Supabase Dashboard |
| **Impact** | 🔒 Users can register with compromised passwords |
| **Time to Fix** | 2 minutes |

**Steps:**
1. Go to Supabase Dashboard
2. Navigate to Authentication → Settings
3. Enable "Leaked Password Protection"
4. Save changes

**Action Items:**
- [ ] Enable leaked password protection in Supabase

---

### P1-3: Configure Sentry Error Tracking

| Attribute | Value |
|-----------|-------|
| **Files** | `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` |
| **Impact** | ⚠️ No error visibility in production |
| **Time to Fix** | 15 minutes |

**Status:** Sentry is installed but not configured with DSN.

**Required Environment Variables:**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/project
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=your-org-name
SENTRY_PROJECT=your-project-name
```

**Action Items:**
- [ ] Create Sentry project (if not exists)
- [ ] Get DSN from Sentry dashboard
- [ ] Add all 4 variables to Vercel
- [ ] Verify errors are captured after deployment

---

### P1-4: Set All Vercel Environment Variables

| Attribute | Value |
|-----------|-------|
| **Location** | Vercel Dashboard → Settings → Environment Variables |
| **Impact** | 🚨 App will not function without these |
| **Time to Fix** | 15 minutes |

**Required Variables:**

| Variable | Environment | Description |
|----------|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production only | Supabase service role key |
| `ADMIN_JWT_SECRET` | All | Generate with `openssl rand -base64 32` |
| `NEXT_PUBLIC_BASE_URL` | Production | `https://aitoolsbook.com` |
| `NEXT_PUBLIC_BASE_URL` | Preview | `https://preview-*.vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | Production | `https://aitoolsbook.com` |

**Optional but Recommended:**

| Variable | Purpose |
|----------|---------|
| `UPSTASH_REDIS_REST_URL` | Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting |
| `NEXT_PUBLIC_SENTRY_DSN` | Error tracking |
| `SENTRY_AUTH_TOKEN` | Source maps upload |
| `SENTRY_ORG` | Sentry organization |
| `SENTRY_PROJECT` | Sentry project name |
| `REVALIDATION_SECRET` | Cache invalidation |

**Action Items:**
- [ ] Add all required variables to Vercel
- [ ] Set different values for Production vs Preview where needed
- [ ] Verify no variables are missing after deployment

---

### P1-5: Create vercel.json Configuration

| Attribute | Value |
|-----------|-------|
| **File** | `vercel.json` (create if not exists) |
| **Impact** | ⚠️ Suboptimal performance and reliability |
| **Time to Fix** | 10 minutes |

**Create `vercel.json`:**
```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ]
}
```

**Notes:**
- `iad1` = US East region (close to Supabase)
- `maxDuration: 10` = 10 second timeout for API routes
- API routes should not be cached

**Action Items:**
- [ ] Create `vercel.json` in project root
- [ ] Adjust region if Supabase is in different location

---

### P1-6: Verify next.config.ts Build Configuration

| Attribute | Value |
|-----------|-------|
| **File** | `next.config.ts` |
| **Impact** | ⚠️ Images may not load, server actions may fail |
| **Time to Fix** | 10 minutes |

**Ensure these settings exist:**
```typescript
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'www.google.com' },  // For favicons
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
```

**Action Items:**
- [ ] Verify `images.remotePatterns` includes Supabase
- [ ] Verify `serverActions.bodySizeLimit` is set
- [ ] Test build locally: `npm run build`

---

## 🟡 P2 - MEDIUM PRIORITY (Optimization)

> **Fix these within Month 1 after deployment**

### P2-1: Add Database Optimization Indexes

| Attribute | Value |
|-----------|-------|
| **Location** | Supabase SQL Editor |
| **Impact** | ⚡ Slow queries on large datasets |
| **Time to Fix** | 15 minutes |

**Run this SQL:**
```sql
-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status);
CREATE INDEX IF NOT EXISTS idx_tools_is_featured ON tools(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_featured_tools_placement ON featured_tools(placement_type);
CREATE INDEX IF NOT EXISTS idx_ai_news_published ON ai_news(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category_id) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
```

**Action Items:**
- [ ] Run index creation SQL in Supabase
- [ ] Monitor query performance after deployment

---

### P2-2: Verify RLS Policies

| Attribute | Value |
|-----------|-------|
| **Location** | Supabase Dashboard → Authentication → Policies |
| **Impact** | 🔒 Data exposure or access denied errors |
| **Time to Fix** | 30 minutes |

**Required Policies:**

| Table | Public Read | Auth Write | Service Role |
|-------|-------------|------------|--------------|
| tools | ✅ (published only) | ❌ | ✅ |
| categories | ✅ | ❌ | ✅ |
| featured_tools | ✅ | ❌ | ✅ |
| ai_news | ✅ (published only) | ❌ | ✅ |
| user_favorites | ❌ | ✅ (own only) | ✅ |
| admin_users | ❌ | ❌ | ✅ |

**Action Items:**
- [ ] Review each table's RLS policies
- [ ] Test public access works for read-only tables
- [ ] Test authenticated users can manage favorites
- [ ] Verify admin operations work via service role

---

### P2-3: Configure Connection Pooling

| Attribute | Value |
|-----------|-------|
| **Location** | Supabase Dashboard → Settings → Database |
| **Impact** | ⚡ Connection exhaustion under load |
| **Time to Fix** | 15 minutes |

**Why:** Vercel serverless functions create new connections per request. Without pooling, you can exhaust database connections.

**Steps:**
1. Go to Supabase Dashboard → Settings → Database
2. Copy the "Connection pooling" URL
3. Use Transaction mode for serverless
4. Update `NEXT_PUBLIC_SUPABASE_URL` if using pooler directly

**Action Items:**
- [ ] Enable connection pooling in Supabase
- [ ] Test under load to verify pooling works

---

### P2-4: Create Cache Invalidation Endpoint

| Attribute | Value |
|-----------|-------|
| **File** | `src/app/api/revalidate/route.ts` |
| **Impact** | ⚠️ Stale data after admin changes |
| **Time to Fix** | 20 minutes |

**Create `src/app/api/revalidate/route.ts`:**
```typescript
import { revalidateTag } from 'next/cache';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { tag, secret } = await request.json();
  
  if (secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ error: 'Invalid secret' }, { status: 401 });
  }
  
  if (!tag) {
    return Response.json({ error: 'Tag required' }, { status: 400 });
  }
  
  revalidateTag(tag);
  return Response.json({ revalidated: true, tag });
}
```

**Available Tags:**
- `tools` - Revalidate tool listings
- `categories` - Revalidate category data
- `featured-tools` - Revalidate homepage featured tools
- `news` - Revalidate AI news
- `stats` - Revalidate homepage stats

**Action Items:**
- [ ] Create revalidation endpoint
- [ ] Add `REVALIDATION_SECRET` to environment variables
- [ ] Call endpoint after admin CRUD operations

---

### P2-5: Add Health Check Endpoint

| Attribute | Value |
|-----------|-------|
| **File** | `src/app/api/health/route.ts` |
| **Impact** | ⚠️ No monitoring capability |
| **Time to Fix** | 15 minutes |

**Create `src/app/api/health/route.ts`:**
```typescript
import { createAnonClient } from '@/lib/supabase/anon';

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();
  
  try {
    const supabase = createAnonClient();
    const { error } = await supabase.from('tools').select('id').limit(1);
    
    return Response.json({
      status: error ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      latency: Date.now() - start,
      database: error ? 'error' : 'connected',
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
    });
  } catch (e) {
    return Response.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: e instanceof Error ? e.message : 'Unknown error',
    }, { status: 503 });
  }
}
```

**Action Items:**
- [ ] Create health check endpoint
- [ ] Set up monitoring (Vercel, UptimeRobot, etc.)
- [ ] Configure alerts for unhealthy status

---

### P2-6: Implement User-Specific "My Tools" Favorites

| Attribute | Value |
|-----------|-------|
| **File** | `src/lib/services/homepage.service.ts`, `src/app/(site)/page.tsx` |
| **Impact** | ⚠️ Logged-in users don't see their saved favorites |
| **Time to Fix** | 1 hour |
| **Team** | Frontend + Backend |

**Current State:** 
- `getMyToolsForHomepage()` returns popular tools for **everyone** (good default fallback)
- No user-specific logic exists yet
- This matches **Option A** decision: user-specific favorites with default choices for non-logged-in users

**Architecture Decision:**
| User State | Behavior |
|------------|----------|
| Not logged in | Show default popular tools (current implementation ✅) |
| Logged in, no favorites | Show default popular tools (fallback) |
| Logged in, has favorites | Show user's saved favorites |

**Required Enhancement:**

**Step 1: Backend - Add new function to `homepage.service.ts`:**
```typescript
// Add to homepage.service.ts
export async function getMyToolsForUser(userId: string | null): Promise<MyTool[]> {
  const supabase = createAnonClient();
  
  // If user is logged in, get their favorites
  if (userId) {
    const { data: favorites } = await supabase
      .from('user_favorites')
      .select(`
        tools (id, name, slug, image_url, website_url)
      `)
      .eq('user_id', userId)
      .limit(11);
    
    if (favorites && favorites.length > 0) {
      return favorites.map(fav => ({
        id: fav.tools.slug,
        name: fav.tools.name,
        icon: fav.tools.image_url || getFaviconUrl(fav.tools.website_url),
        url: `/tool/${fav.tools.slug}`,
        color: getColorFromString(fav.tools.name, DEFAULT_TOOL_COLORS),
      }));
    }
  }
  
  // Fallback to popular tools for non-logged-in or users with no favorites
  return getMyToolsForHomepage();
}
```

**Step 2: Frontend - Update `page.tsx` to pass user session:**
```typescript
// In src/app/(site)/page.tsx
import { createServerClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const [trendingNews, stats, featuredToolsData, categoriesData, myToolsData] = await Promise.all([
    NewsService.getTrendingNews(),
    getHomePageStats(),
    getFeaturedToolsForHomepage(),
    getCategoriesForHomepage(),
    getMyToolsForUser(user?.id ?? null),  // Pass user ID
  ]);
  // ...
}
```

**Step 3: Database - Verify `user_favorites` table has proper RLS:**
```sql
-- Ensure users can only read their own favorites
CREATE POLICY "Users can read own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

-- Ensure users can insert their own favorites
CREATE POLICY "Users can insert own favorites" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ensure users can delete their own favorites
CREATE POLICY "Users can delete own favorites" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);
```

**Action Items:**
- [ ] **Backend:** Add `getMyToolsForUser()` function to `homepage.service.ts`
- [ ] **Frontend:** Update `page.tsx` to get user session and pass user ID
- [ ] **Database:** Verify `user_favorites` RLS policies allow user-specific reads
- [ ] **Testing:** Test with logged-in user with favorites
- [ ] **Testing:** Test with logged-in user without favorites (should fallback)
- [ ] **Testing:** Test with anonymous user (should show popular tools)

**Dependencies:**
- Requires `user_favorites` table to exist (✅ already in schema)
- Requires Supabase Auth to be working (✅ already implemented)
- No blocking dependencies on other P2 tasks

---

## 🟢 P3 - LOW PRIORITY (Future Improvements)

> **Address these as needed**

### P3-1: Implement Supabase Storage for Images

| Attribute | Value |
|-----------|-------|
| **Impact** | Feature enhancement |
| **Time to Fix** | 2-4 hours |

**Current State:** Tool images use external URLs.

**Future State:**
- Create `tool-images` storage bucket
- Add image upload in admin panel
- Use signed URLs for private assets
- Implement image optimization

**Action Items:**
- [ ] Create storage bucket in Supabase
- [ ] Add upload endpoint in admin API
- [ ] Update tool form to support image upload
- [ ] Migrate existing images (optional)

---

### P3-2: Consider Consolidating Auth Systems

| Attribute | Value |
|-----------|-------|
| **Impact** | Technical debt reduction |
| **Time to Fix** | 4-8 hours |

**Current State:**
- **Admin Auth:** Custom JWT with httpOnly cookies
- **User Auth:** Supabase Auth

**This works fine** but adds complexity. Future option: migrate admin auth to Supabase Auth with custom claims.

**Pros of Current System:**
- Admin auth is isolated from user auth
- Custom JWT gives full control
- Account lockout is implemented

**Cons:**
- Two auth systems to maintain
- Different session handling

**Recommendation:** Keep current system unless maintenance becomes burdensome.

---

## ✅ What's Already Working Well

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ | 18 tables with RLS enabled |
| API Routes | ✅ | Using Supabase correctly |
| Services Layer | ✅ | `unstable_cache` for performance |
| Rate Limiting | ✅ | Upstash Redis configured |
| Admin Auth | ✅ | JWT + account lockout |
| User Auth | ✅ | Supabase Auth |
| Middleware | ✅ | Session refresh + rate limiting |
| TypeScript Types | ✅ | Auto-generated from Supabase |
| Sentry Setup | ✅ | Config files exist (needs DSN) |

---

## 📋 Deployment Checklists

### Pre-Deployment Checklist (P0 Issues)

```
[x] P0-1: Update admin/actions.ts imports ✅
[x] P0-1: Delete admin.service.ts ✅
[x] P0-1: Delete mock-db.json ✅
[x] P0-2: Create homepage.service.ts ✅
[x] P0-2: Update page.tsx to use database queries ✅
[x] P0-2: Remove static JSON imports ✅
[ ] P0-3: Run database seeding migration
[ ] P0-3: Verify data appears on homepage
[ ] P0-4: Add NEXT_PUBLIC_SITE_URL to .env.example
[ ] P0-4: Add NEXT_PUBLIC_SITE_URL to Vercel
[ ] P0-5: Verify all admin API routes have requireAdmin()
[ ] Test build locally: npm run build
[ ] Run tests: npm test
```

### Vercel Deployment Checklist

```
[ ] Connect GitHub repository to Vercel
[ ] Set all required environment variables
[ ] Set different values for Production vs Preview
[ ] Deploy to preview first
[ ] Test all critical flows on preview:
    [ ] Homepage loads with real data
    [ ] Tool detail pages work
    [ ] Category pages work
    [ ] Search works
    [ ] Admin login works
    [ ] Admin CRUD operations work
    [ ] User authentication works
[ ] Deploy to production
```

### Post-Deployment Checklist

```
[ ] Verify homepage loads with database data
[ ] Test admin login
[ ] Test tool creation/editing/deletion
[ ] Test user registration/login
[ ] Check rate limiting works
[ ] Verify sitemap.xml has correct URLs
[ ] Monitor Sentry for errors
[ ] Check health endpoint responds
[ ] Test on mobile devices
```

### Week 1 Checklist (P1 Issues)

```
[ ] P1-1: Fix all 5 Supabase function search_path warnings
[ ] P1-2: Enable leaked password protection
[ ] P1-3: Configure Sentry with DSN
[ ] P1-4: Verify all environment variables are set
[ ] P1-5: Create vercel.json
[ ] P1-6: Verify next.config.ts settings
```

### Month 1 Checklist (P2 Issues)

```
[ ] P2-1: Add database optimization indexes
[ ] P2-2: Verify RLS policies
[ ] P2-3: Configure connection pooling
[ ] P2-4: Create cache invalidation endpoint
[ ] P2-5: Add health check endpoint
[ ] P2-6: Implement user-specific "My Tools" favorites
    [ ] Backend: Add getMyToolsForUser() to homepage.service.ts
    [ ] Frontend: Update page.tsx to pass user session ID
    [ ] Database: Verify user_favorites RLS policies
    [ ] Test: Logged-in user with favorites
    [ ] Test: Logged-in user without favorites (fallback)
    [ ] Test: Anonymous user (popular tools)
[ ] Set up monitoring/alerting
```

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                           VERCEL                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Next.js 16 App                          │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │  │
│  │  │   Pages    │  │    API     │  │   Server Actions   │   │  │
│  │  │ (SSR/ISR)  │  │   Routes   │  │                    │   │  │
│  │  └─────┬──────┘  └─────┬──────┘  └─────────┬──────────┘   │  │
│  │        │               │                    │              │  │
│  │        └───────────────┼────────────────────┘              │  │
│  │                        │                                   │  │
│  │                ┌───────▼────────┐                          │  │
│  │                │ Services Layer │                          │  │
│  │                │ (with caching) │                          │  │
│  │                └───────┬────────┘                          │  │
│  └────────────────────────┼───────────────────────────────────┘  │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │ HTTPS
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   SUPABASE    │  │    UPSTASH    │  │    SENTRY     │
│  ┌─────────┐  │  │    REDIS      │  │   (Errors)    │
│  │Postgres │  │  │ (Rate Limit)  │  │               │
│  │  + RLS  │  │  │               │  │               │
│  └─────────┘  │  └───────────────┘  └───────────────┘
│  ┌─────────┐  │
│  │  Auth   │  │
│  └─────────┘  │
│  ┌─────────┐  │
│  │ Storage │  │
│  │(future) │  │
│  └─────────┘  │
└───────────────┘
```

---

## ⏱️ Estimated Timeline

| Phase | Tasks | Time Estimate | Status |
|-------|-------|---------------|--------|
| **Day 1** | P0-1: Fix filesystem dependency | 30 min | ✅ Done |
| **Day 1** | P0-2: Create homepage.service.ts | 1-2 hours | ✅ Done |
| **Day 1** | P0-3: Seed database | 1 hour | ⏳ Next |
| **Day 1** | P0-4: Add missing env var | 5 min | ⏳ Pending |
| **Day 1** | P0-5: Verify admin auth | 30 min | ⏳ Pending |
| **Day 2** | Test build locally | 30 min | ⏳ Pending |
| **Day 2** | Deploy to Vercel preview | 30 min | ⏳ Pending |
| **Day 2** | Test all flows on preview | 1-2 hours | ⏳ Pending |
| **Day 2** | Deploy to production | 15 min | ⏳ Pending |
| **Day 2** | Post-deployment verification | 1 hour | ⏳ Pending |
| **Week 1** | P1 issues (security, config) | 2-3 hours | ⏳ Pending |
| **Month 1** | P2 issues (optimization + user favorites) | 4-5 hours | ⏳ Pending |

**Remaining Time to Production:** ~4-5 hours

---

## ✅ Questions Resolved

### 1. "My Tools" Section
**Decision: Option A** - User-specific favorites (requires login to see)
- Logged-in users see their saved favorites
- Non-logged-in users see default popular tools (current implementation)
- **Status:** Default fallback implemented in `homepage.service.ts`, user-specific logic to be added in P2

### 2. Featured Tools Data
**Decision: Option A** - Migrate all 16 from JSON to database
- All 16 featured tools from JSON will be seeded into the database
- **Status:** Pending P0-3 database seeding

### 3. Category Tool Counts
**Decision: Option A** - Use real counts from database
- Display actual tool counts from database
- No inflated marketing numbers
- **Status:** Implemented in `getCategoriesForHomepage()`

---

## 📝 Issue Summary Table

| # | Priority | Issue | Impact | Time | Status |
|---|----------|-------|--------|------|--------|
| 1 | 🔴 P0 | Filesystem dependency | Deployment crash | 30m | ✅ Done |
| 2 | 🔴 P0 | Static JSON on homepage | Stale data | 1-2h | ✅ Done |
| 3 | 🔴 P0 | Database needs seeding | Empty homepage | 1h | ⏳ Next |
| 4 | 🔴 P0 | Missing env variable | Broken URLs | 5m | ⏳ Pending |
| 5 | 🔴 P0 | Admin auth verification | Security | 30m | ⏳ Pending |
| 6 | 🟠 P1 | Mutable search_path | Security | 30m | ⏳ Pending |
| 7 | 🟠 P1 | Leaked password protection | Security | 2m | ⏳ Pending |
| 8 | 🟠 P1 | Sentry configuration | Observability | 15m | ⏳ Pending |
| 9 | 🟠 P1 | Vercel env variables | Deployment | 15m | ⏳ Pending |
| 10 | 🟠 P1 | vercel.json config | Performance | 10m | ⏳ Pending |
| 11 | 🟠 P1 | next.config.ts verify | Build | 10m | ⏳ Pending |
| 12 | 🟡 P2 | Database indexes | Performance | 15m | ⏳ Pending |
| 13 | 🟡 P2 | RLS policies verify | Security | 30m | ⏳ Pending |
| 14 | 🟡 P2 | Connection pooling | Scalability | 15m | ⏳ Pending |
| 15 | 🟡 P2 | Cache invalidation | Data freshness | 20m | ⏳ Pending |
| 16 | 🟡 P2 | Health check endpoint | Monitoring | 15m | ⏳ Pending |
| 17 | 🟡 P2 | User-specific My Tools | Feature | 1h | ⏳ Pending |
| 18 | 🟢 P3 | Supabase storage | Feature | 2-4h | ⏳ Pending |
| 19 | 🟢 P3 | Auth consolidation | Tech debt | 4-8h | ⏳ Pending |

---

## 🚀 Quick Start Commands

```bash
# 1. Test build locally
npm run build

# 2. Run tests
npm test

# 3. Generate new admin JWT secret
openssl rand -base64 32

# 4. Start local dev server
npm run dev
```

---

*This comprehensive deployment plan was generated on January 10, 2026 by analyzing z1.md, z2.md, and the original DEPLOYMENT_PLAN.md using sequential thinking to ensure all issues are captured and properly prioritized.*
