# Google OAuth Setup Guide for Supabase

A step-by-step guide to enable Google OAuth authentication in your Supabase project.

---

## Step 1: Google Cloud Console Setup

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/) and create or select a project

- [ ] Navigate to **APIs & Services > OAuth consent screen**:
  - [ ] Choose "External" user type (unless you have Google Workspace)
  - [ ] Fill in app name, user support email, and developer contact
  - [ ] Add scopes: `openid`, `email`, `profile`
  - [ ] Save and continue

- [ ] Go to **APIs & Services > Credentials**:
  - [ ] Click "Create Credentials" > "OAuth client ID"
  - [ ] Application type: **Web application**
  - [ ] Name: Your app name
  - [ ] **Authorized JavaScript origins**:
    - `http://localhost:3000` (for local dev)
    - `https://your-production-domain.com`
  - [ ] **Authorized redirect URIs**:
    - `https://<your-project-ref>.supabase.co/auth/v1/callback`
    - `http://localhost:3000/auth/callback` (for local dev)
  - [ ] Click "Create" and save the **Client ID** and **Client Secret**

---

## Step 2: Supabase Dashboard Configuration

- [ ] Go to your [Supabase Dashboard](https://supabase.com/dashboard)
- [ ] Select your project
- [ ] Navigate to **Authentication > Providers**
- [ ] Find **Google** and click to expand
- [ ] Toggle **Enable Sign in with Google** to ON
- [ ] Enter your **Client ID** and **Client Secret** from Google
- [ ] Click **Save**

---

## Step 3: Add Google Sign-In to Your Auth Service

- [ ] Add this function to `src/lib/services/auth.service.ts`:

```typescript
/**
 * Sign in with Google OAuth using Supabase Auth.
 * Redirects user to Google consent screen, then back to callback route.
 * 
 * @param redirectTo - Optional path to redirect after successful sign-in
 * @returns AuthResult with success status or error message
 */
export async function signInWithGoogle(redirectTo?: string): Promise<AuthResult> {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''}`,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Google sign-in failed. Please try again.',
      };
    }

    // OAuth redirects, so this won't actually return in normal flow
    return { success: true };
  } catch {
    return {
      success: false,
      error: 'Unable to connect to Google. Please try again.',
    };
  }
}
```

---

## Step 4: Update Environment Variables

- [ ] Add to your `.env.local` (optional, only needed for Google One-Tap):

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## Step 5: Add Google Button to Login UI

- [ ] In your login form component, add a Google sign-in button:

```tsx
import { signInWithGoogle } from '@/lib/services/auth.service';

// In your component:
const handleGoogleSignIn = async () => {
  const result = await signInWithGoogle();
  if (!result.success && result.error) {
    // Handle error (show toast, etc.)
    console.error(result.error);
  }
  // User will be redirected to Google, then back to your app
};

// Button JSX:
<button
  onClick={handleGoogleSignIn}
  className="flex items-center justify-center gap-2 w-full px-4 py-2 border rounded-lg hover:bg-gray-50"
>
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
  Continue with Google
</button>
```

---

## Your Callback Route is Ready ✓

Your existing `src/app/auth/callback/route.ts` already handles the OAuth code exchange correctly - no changes needed there!

---

## Testing Checklist

- [ ] Google Cloud OAuth credentials created
- [ ] Redirect URIs configured in Google Console
- [ ] Google provider enabled in Supabase Dashboard
- [ ] `signInWithGoogle` function added to auth service
- [ ] Google button added to login UI
- [ ] Test sign-in flow locally
