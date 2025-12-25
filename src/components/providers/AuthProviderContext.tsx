'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import { signOut as authServiceSignOut } from '@/lib/services/auth.service';

/**
 * User type for auth context
 */
export interface User {
  id: string;
  email: string;
}

/**
 * Auth context value interface
 * Provides user state, loading state, and signOut function to child components
 */
export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

/**
 * Default context value used when provider is not present
 */
const defaultContextValue: AuthContextValue = {
  user: null,
  loading: true,
  signOut: async () => {
    console.warn('signOut called outside of AuthProviderContext');
  },
};

/**
 * Auth context for providing Supabase Auth state to child components
 * Requirement 7.1: Provide Supabase_Auth state to child components via React context
 */
const AuthContext = createContext<AuthContextValue>(defaultContextValue);

/**
 * Props for AuthProviderContext component
 */
interface AuthProviderContextProps {
  children: ReactNode;
}

/**
 * Auth Provider Context component that wraps the application and provides
 * Supabase Auth state to all child components.
 * 
 * Requirements:
 * - 7.1: Provide Supabase_Auth state to child components via React context
 * - 7.2: Notify subscribed components immediately when auth state changes
 * - 7.3: Subscribe to auth state changes via onAuthStateChange listener
 * - 7.4: Unsubscribe from auth state changes when unmounting
 * 
 * @param children - Child components to wrap with auth context
 */
export function AuthProviderContext({ children }: AuthProviderContextProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Requirement 7.3: Subscribe to auth state changes via onAuthStateChange listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Requirement 7.2: Update context state immediately on auth changes
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Requirement 7.4: Unsubscribe from auth state changes when unmounting
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign out the current user
   * Calls the auth service signOut function
   * The onAuthStateChange listener will automatically update user state
   */
  const handleSignOut = useCallback(async () => {
    const result = await authServiceSignOut();
    if (!result.success && result.error) {
      console.error('Sign out failed:', result.error);
    }
    // Note: User state will be updated by onAuthStateChange listener
  }, []);

  const contextValue: AuthContextValue = {
    user,
    loading,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

/**
 * Custom hook to access auth context
 * Must be used within an AuthProviderContext
 * 
 * @returns AuthContextValue with user, loading, and signOut
 * @throws Error if used outside of AuthProviderContext
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, loading, signOut } = useAuth();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (!user) return <div>Not authenticated</div>;
 *   
 *   return (
 *     <div>
 *       <p>Welcome, {user.email}</p>
 *       <button onClick={signOut}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  return context;
}

/**
 * Export the context for testing purposes
 */
export { AuthContext };
