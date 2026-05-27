import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase, hasSupabaseEnv } from '@/lib/supabaseClient';

/**
 * Stage 1 auth context.
 *
 * - When VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY are present, this
 *   subscribes to Supabase auth state and exposes the real session + user.
 * - Without those env vars, the app falls back to a local "demo" session so
 *   designers can keep iterating on layout/content. The demo session is
 *   purely in-memory; refresh resets it. Stage 2 will remove this fallback
 *   path by wiring real env vars in Vercel.
 */

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  mode: 'supabase' | 'demo';
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithPassword: (email: string, password: string, name?: string) => Promise<{ error: string | null; message?: string }>;
  signOut: () => Promise<void>;
  enterDemoMode: (name?: string) => void;
};

const AuthCtx = createContext<AuthState | null>(null);

function makeDemoUser(name = 'Tommy'): User {
  return {
    id: 'demo-user',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'demo@iron.local',
    app_metadata: {},
    user_metadata: { full_name: name, display_name: name },
    created_at: new Date().toISOString(),
  } as unknown as User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supa = getSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(supa));
  const mode: 'supabase' | 'demo' = hasSupabaseEnv() ? 'supabase' : 'demo';

  useEffect(() => {
    if (!supa) {
      setLoading(false);
      return;
    }
    let mounted = true;
    supa.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supa.auth.onAuthStateChange((_e, s) => {
      setSession(s ?? null);
      setUser(s?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supa]);

  const signInWithPassword = useCallback<AuthState['signInWithPassword']>(async (email, password) => {
    if (!supa) {
      // Demo fallback — any non-empty email signs you in as the demo user.
      if (!email) return { error: 'Email is required.' };
      setUser(makeDemoUser(email.split('@')[0] || 'Tommy'));
      return { error: null };
    }
    const { error } = await supa.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, [supa]);

  const signUpWithPassword = useCallback<AuthState['signUpWithPassword']>(async (email, password, name) => {
    if (!supa) {
      if (!email) return { error: 'Email is required.' };
      setUser(makeDemoUser(name || email.split('@')[0] || 'Tommy'));
      return { error: null };
    }
    const { data, error } = await supa.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: name || email.split('@')[0],
          display_name: name || email.split('@')[0],
        },
      },
    });
    return {
      error: error?.message ?? null,
      message: data.user && !data.session ? 'Account created. Check your email to confirm, then sign in.' : undefined,
    };
  }, [supa]);

  const signOut = useCallback<AuthState['signOut']>(async () => {
    if (supa) await supa.auth.signOut();
    setUser(null);
    setSession(null);
  }, [supa]);

  const enterDemoMode = useCallback<AuthState['enterDemoMode']>((name) => {
    setUser(makeDemoUser(name));
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, session, loading, mode, signInWithPassword, signUpWithPassword, signOut, enterDemoMode }),
    [user, session, loading, mode, signInWithPassword, signUpWithPassword, signOut, enterDemoMode],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(AuthCtx);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}

function titleCase(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function useDisplayName(): string {
  const { user } = useAuth();
  if (!user) return 'there';
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fromMeta = (meta.display_name as string) || (meta.full_name as string) || (meta.name as string);
  if (fromMeta) return titleCase(fromMeta);
  if (user.email) return titleCase(user.email.split('@')[0]);
  return 'lifter';
}
