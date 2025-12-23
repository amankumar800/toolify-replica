# Backend Fixes TODO - Path to 99.9% Uptime

**Status**: 🔴 Critical Issues Present  
**Target**: 99.9% Uptime (43 min downtime/month max)  
**Last Updated**: December 23, 2024

---

## 🚨 CRITICAL - Fix Immediately (Week 1)

### ❌ 1. Remove Filesystem Database (SHOWSTOPPER)
**Priority**: P0 - BLOCKING PRODUCTION  
**File**: `src/lib/services/admin.service.ts`  
**Issue**: Using filesystem (mock-db.json) instead of Supabase. Won't work on Vercel.

**Action Items**:
- [ ] Delete `src/lib/services/admin.service.ts`
- [ ] Delete `src/data/mock-db.json`
- [ ] Update `src/app/admin/actions.ts` to use `tools.service.ts` instead
- [ ] Test all admin CRUD operations with Supabase
- [ ] Verify data persistence after deployment

**Estimated Time**: 2-3 hours

---

### ❌ 2. Fix Authentication Conflict
**Priority**: P0 - SECURITY RISK  
**Files**: `src/lib/auth.ts`, `src/middleware.ts`, `supabase/migrations/*_rls_policies.sql`  
**Issue**: Using next-auth but RLS policies expect Supabase Auth JWT

**Action Items**:
- [ ] **Decision**: Choose ONE auth system
  - [ ] Option A: Migrate to Supabase Auth (recommended)
  - [ ] Option B: Keep next-auth and remove RLS policies
- [ ] If Supabase Auth:
  - [ ] Remove next-auth dependencies
  - [ ] Update `src/lib/auth.ts` to use Supabase Auth
  - [ ] Update middleware to use `src/lib/supabase/middleware.ts`
  - [ ] Test user_favorites RLS policies
- [ ] If next-auth:
  - [ ] Remove RLS policies from migrations
  - [ ] Implement authorization in application code
  - [ ] Add user_id column linked to next-auth

**Estimated Time**: 4-6 hours

---

### ❌ 3. Add Error Tracking
**Priority**: P0 - OBSERVABILITY  
**Issue**: No error monitoring = blind to production issues

**Action Items**:
- [ ] Sign up for Sentry (free tier)
- [ ] Install: `npm install @sentry/nextjs`
- [ ] Run: `npx @sentry/wizard@latest -i nextjs`
- [ ] Configure error boundaries in `src/app/layout.tsx`
- [ ] Test error reporting
- [ ] Set up alerts for critical errors

**Estimated Time**: 30 minutes

**Resources**: https://docs.sentry.io/platforms/javascript/guides/nextjs/

---

### ❌ 4. Implement Rate Limiting
**Priority**: P0 - SECURITY  
**Issue**: No protection against abuse/DDoS

**Action Items**:
- [ ] Install: `npm install @upstash/ratelimit @upstash/redis`
- [ ] Sign up for Upstash Redis (free tier)
- [ ] Create `src/lib/rate-limit.ts`:
```typescript
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
})
```
- [ ] Add to server actions in `src/app/actions.ts`
- [ ] Add to API routes
- [ ] Test rate limiting behavior

**Estimated Time**: 1-2 hours

---

### ❌ 5. Add Health Check Endpoint
**Priority**: P1 - MONITORING  
**Issue**: Can't monitor if app is healthy

**Action Items**:
- [ ] Create `src/app/api/health/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('tools').select('id').limit(1)
    
    return Response.json({
      status: error ? 'unhealthy' : 'healthy',
      timestamp: new Date().toISOString(),
      database: error ? 'down' : 'up'
    }, { status: error ? 503 : 200 })
  } catch (e) {
    return Response.json({
      status: 'unhealthy',
      error: 'Database connection failed'
    }, { status: 503 })
  }
}
```
- [ ] Test endpoint: `curl http://localhost:3000/api/health`
- [ ] Set up UptimeRobot to monitor this endpoint

**Estimated Time**: 30 minutes

---

## 🔶 HIGH PRIORITY (Month 1)

### ⚠️ 6. Implement Caching Strategy
**Priority**: P1 - PERFORMANCE  
**Issue**: Every request hits database (75% load reduction possible with caching)

**Action Items**:
- [ ] **Phase 1**: Next.js Cache (Easy wins)
  - [ ] Wrap `getCategories()` with `cache()` from React
  - [ ] Add `revalidate` to static pages
  - [ ] Use `unstable_cache` for expensive queries
- [ ] **Phase 2**: Redis Cache (Hot data)
  - [ ] Set up Upstash Redis
  - [ ] Cache featured tools (5 min TTL)
  - [ ] Cache category lists (10 min TTL)
  - [ ] Cache tool counts (5 min TTL)
- [ ] **Phase 3**: Implement cache invalidation
  - [ ] Invalidate on tool create/update/delete
  - [ ] Add cache warming for critical data

**Estimated Time**: 6-8 hours

**Example**:
```typescript
import { cache } from 'react'
import { unstable_cache } from 'next/cache'

export const getCategories = cache(async () => {
  return unstable_cache(
    async () => {
      // existing logic
    },
    ['categories'],
    { revalidate: 600 } // 10 minutes
  )()
})
```

---

### ⚠️ 7. Fix Connection Pooling
**Priority**: P1 - SCALABILITY  
**Files**: `src/lib/services/*.service.ts`  
**Issue**: Creating new Supabase client on every function call

**Action Items**:
- [ ] Create singleton admin client in `src/lib/supabase/admin.ts`:
```typescript
let adminClientInstance: SupabaseClient<Database> | null = null

export function getAdminClient() {
  if (!adminClientInstance) {
    adminClientInstance = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        db: { schema: 'public' },
        global: { headers: { 'x-application-name': 'toolify-admin' } }
      }
    )
  }
  return adminClientInstance
}
```
- [ ] Update all services to use `getAdminClient()`
- [ ] Test under load (use `autocannon` or similar)
- [ ] Monitor connection count in Supabase dashboard

**Estimated Time**: 2-3 hours

---

### ⚠️ 8. Implement Full-Text Search
**Priority**: P1 - PERFORMANCE  
**Issue**: ILIKE search is slow and won't scale

**Action Items**:
- [ ] Create migration `supabase/migrations/YYYYMMDD_add_fulltext_search.sql`:
```sql
-- Add tsvector column
ALTER TABLE tools ADD COLUMN search_vector tsvector;

-- Create index
CREATE INDEX idx_tools_search ON tools USING gin(search_vector);

-- Create trigger to auto-update
CREATE FUNCTION tools_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.short_description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tools_search_update 
  BEFORE INSERT OR UPDATE ON tools
  FOR EACH ROW EXECUTE FUNCTION tools_search_trigger();

-- Backfill existing data
UPDATE tools SET search_vector = 
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(short_description, '')), 'C');
```
- [ ] Update `src/lib/db/repositories/tools.repository.ts` search method:
```typescript
async search(query: string, limit?: number): Promise<ToolRow[]> {
  let searchQuery = supabase
    .from(tableName as any)
    .select('*')
    .textSearch('search_vector', query, { type: 'websearch' })
    .order('name', { ascending: true })
  
  if (limit) searchQuery = searchQuery.limit(limit)
  const { data, error } = await searchQuery
  if (error) throw wrapError(error, 'search')
  return (data ?? []) as unknown as ToolRow[]
}
```
- [ ] Test search performance
- [ ] Add search analytics

**Estimated Time**: 3-4 hours

---

### ⚠️ 9. Add Proper RBAC
**Priority**: P1 - SECURITY  
**File**: `src/middleware.ts`  
**Issue**: Any logged-in user can access admin panel

**Action Items**:
- [ ] Add `role` field to user table/session
- [ ] Update middleware:
```typescript
export async function middleware(request: NextRequest) {
  if (pathname.startsWith('/admin')) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Check role
    if (token.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }
  return NextResponse.next()
}
```
- [ ] Create admin user management system
- [ ] Add role to JWT token
- [ ] Test authorization flows

**Estimated Time**: 4-5 hours

---

### ⚠️ 10. Add Monitoring & Alerts
**Priority**: P1 - OBSERVABILITY  

**Action Items**:
- [ ] **Vercel Analytics**
  - [ ] Enable in Vercel dashboard
  - [ ] Add Web Vitals tracking
- [ ] **Supabase Monitoring**
  - [ ] Review built-in metrics dashboard
  - [ ] Set up connection pool alerts
  - [ ] Monitor query performance
- [ ] **Uptime Monitoring**
  - [ ] Sign up for UptimeRobot (free)
  - [ ] Monitor `/api/health` endpoint
  - [ ] Set up email/SMS alerts
  - [ ] Target: 99.9% uptime
- [ ] **Log Aggregation**
  - [ ] Consider Axiom or Logtail for Next.js
  - [ ] Structured logging format
  - [ ] Log levels (error, warn, info)

**Estimated Time**: 2-3 hours

---

## 🔵 MEDIUM PRIORITY (Quarter 1)

### 📋 11. Database Optimization
**Priority**: P2 - PERFORMANCE

**Action Items**:
- [ ] Run query analysis: `EXPLAIN ANALYZE` on slow queries
- [ ] Add composite indexes:
```sql
CREATE INDEX idx_tools_pricing_featured ON tools(pricing, is_featured);
CREATE INDEX idx_tools_created_featured ON tools(created_at DESC) WHERE is_featured = true;
CREATE INDEX idx_tool_categories_composite ON tool_categories(category_id, tool_id);
```
- [ ] Add covering indexes for common queries
- [ ] Review and optimize N+1 queries
- [ ] Set up query performance monitoring
- [ ] Consider materialized views for complex aggregations

**Estimated Time**: 6-8 hours

---

### 📋 12. Improve Error Handling
**Priority**: P2 - RELIABILITY

**Action Items**:
- [ ] Create error utility `src/lib/errors/handler.ts`:
```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public isOperational = true
  ) {
    super(message)
  }
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return { error: error.message, code: error.code }
  }
  // Log unexpected errors
  console.error('Unexpected error:', error)
  return { error: 'Internal server error', code: 'INTERNAL_ERROR' }
}
```
- [ ] Implement circuit breaker pattern for external APIs
- [ ] Add retry logic with exponential backoff
- [ ] Create error boundaries for React components
- [ ] Standardize error responses

**Estimated Time**: 4-6 hours

---

### 📋 13. Load Testing
**Priority**: P2 - SCALABILITY

**Action Items**:
- [ ] Install: `npm install -g autocannon`
- [ ] Test critical endpoints:
```bash
autocannon -c 100 -d 30 http://localhost:3000/api/health
autocannon -c 50 -d 30 http://localhost:3000/
```
- [ ] Identify bottlenecks
- [ ] Test database connection limits
- [ ] Test rate limiting behavior
- [ ] Document performance baselines
- [ ] Set up performance budgets

**Estimated Time**: 4-5 hours

---

### 📋 14. Backup & Disaster Recovery
**Priority**: P2 - RELIABILITY

**Action Items**:
- [ ] Enable Supabase automated backups (daily)
- [ ] Test backup restoration process
- [ ] Document recovery procedures
- [ ] Set up point-in-time recovery (PITR)
- [ ] Create runbook for common incidents
- [ ] Test failover scenarios
- [ ] Set up database replication (if needed)

**Estimated Time**: 3-4 hours

---

### 📋 15. CI/CD Improvements
**Priority**: P2 - QUALITY

**Action Items**:
- [ ] Add pre-deployment checks:
  - [ ] Run tests: `npm test`
  - [ ] Type checking: `tsc --noEmit`
  - [ ] Linting: `npm run lint`
- [ ] Set up staging environment
- [ ] Implement blue-green deployments
- [ ] Add smoke tests post-deployment
- [ ] Set up automatic rollback on errors
- [ ] Add deployment notifications

**Estimated Time**: 6-8 hours

---

## 📊 Success Metrics

Track these metrics to ensure 99.9% uptime:

- [ ] **Uptime**: 99.9% (max 43 min downtime/month)
- [ ] **Error Rate**: < 0.1%
- [ ] **Response Time**: p95 < 500ms, p99 < 1000ms
- [ ] **Database Connections**: < 80% of pool
- [ ] **Cache Hit Rate**: > 80%
- [ ] **API Rate Limit**: < 1% requests throttled
- [ ] **Time to Recovery**: < 5 minutes

---

## 📝 Progress Tracking

### Week 1 Checklist
- [ ] Critical Issue #1: Remove filesystem database
- [ ] Critical Issue #2: Fix auth conflict
- [ ] Critical Issue #3: Add error tracking
- [ ] Critical Issue #4: Implement rate limiting
- [ ] Critical Issue #5: Add health check

**Target Completion**: [DATE]

### Month 1 Checklist
- [ ] High Priority #6: Implement caching
- [ ] High Priority #7: Fix connection pooling
- [ ] High Priority #8: Full-text search
- [ ] High Priority #9: Proper RBAC
- [ ] High Priority #10: Monitoring & alerts

**Target Completion**: [DATE]

### Quarter 1 Checklist
- [ ] Medium Priority #11-15: All items

**Target Completion**: [DATE]

---

## 🔗 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/features/ratelimiting)
- [Postgres Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)

---

**Notes**:
- Update this file as you complete tasks
- Add actual dates to target completion fields
- Document any blockers or issues encountered
- Review and adjust priorities as needed
