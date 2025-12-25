# Authentication Recommendation

## Use Supabase Auth (Not NextAuth)

After analyzing the project structure, existing code, and authentication requirements, **Supabase Auth** is the recommended authentication provider for this project.

---

## Why Supabase Auth is the Right Choice

### 1. RLS Policies Are Built for Supabase Auth

Your `user_favorites` table has Row Level Security (RLS) policies using Supabase Auth's JWT format:

```sql
auth.jwt() ->> 'email' = user_email
```

NextAuth JWTs are structured differently and **won't work** with these policies without significant rewrites.

---

### 2. Current Setup is Incomplete/Hybrid

The project currently has a confusing mixed state:

- NextAuth is partially configured (API routes exist)
- `auth.service.ts` is just a **mock** (doesn't actually authenticate)
- Supabase middleware exists but isn't being used

This creates confusion and maintenance burden.

---

### 3. Native Integration Benefits

Supabase Auth integrates seamlessly with:

| Feature | Benefit |
|---------|---------|
| Row Level Security | Works out of the box |
| Supabase Storage | Secure file uploads with user context |
| Supabase Realtime | Live features with built-in auth |
| Server-side rendering | `@supabase/ssr` already set up |

---

### 4. Google OAuth is Supported

Supabase Auth supports Google OAuth natively, so you don't lose any functionality. Configure it directly in the Supabase Dashboard.

---

## Comparison Table

| Feature | Supabase Auth | NextAuth + Google |
|---------|:-------------:|:-----------------:|
| RLS Compatibility | ✅ Native | ❌ Requires custom JWT handling |
| Setup Complexity | Simple | Complex (adapter needed) |
| Dependencies | Already installed | Additional packages |
| Middleware | Ready to use | Custom implementation |
| Storage/Realtime Auth | ✅ Built-in | ❌ Manual integration |
| User Management | ✅ Dashboard included | ❌ Build your own |

---

## Updated Environment Variables

If you switch to Supabase Auth, your `.env` simplifies to:

```env
# ============================================
# SUPABASE (Required)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://sxepzgwkbsynilkronsj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ============================================
# APPLICATION
# ============================================
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# ============================================
# REMOVED - No longer needed with Supabase Auth
# ============================================
# NEXTAUTH_SECRET
# NEXTAUTH_URL
# GOOGLE_CLIENT_ID (configure in Supabase Dashboard instead)
# GOOGLE_CLIENT_SECRET
```

---

## Migration Steps

### Step 1: Enable Google OAuth in Supabase

1. Go to [Supabase Dashboard → Authentication → Providers](https://supabase.com/dashboard/project/sxepzgwkbsynilkronsj/auth/providers)
2. Enable Google provider
3. Add your Google OAuth credentials (Client ID & Secret)
4. Configure redirect URLs

### Step 2: Update LoginForm

Replace the mock auth service with Supabase Auth:

```typescript
// Before (mock)
await authService.loginWithGoogle();

// After (Supabase Auth)
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
});
```

### Step 3: Activate Supabase Middleware

Update `src/middleware.ts` to use the existing Supabase session refresh:

```typescript
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
```

### Step 4: Remove NextAuth Dependencies

```bash
npm uninstall next-auth
```

Remove these files:
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/lib/auth.ts`

### Step 5: Create Auth Callback Route

Create `src/app/auth/callback/route.ts` for OAuth redirects:

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
```

---

## Summary

Switching to Supabase Auth will:

- ✅ Make RLS policies work correctly
- ✅ Simplify the codebase (one auth system)
- ✅ Reduce dependencies
- ✅ Enable native Storage and Realtime auth
- ✅ Provide a user management dashboard

---

*Document created: December 25, 2025*
