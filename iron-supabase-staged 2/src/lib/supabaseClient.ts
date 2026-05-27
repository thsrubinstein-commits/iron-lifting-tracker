// Stage 1 scaffolding. The client is created lazily so the app can boot
// (and the auth screen can render) even when env vars are not yet wired up.
//
// Stage 2 task: provide VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
// in a local .env file or Vercel project settings. Nothing else needs to
// change in the app — useAuth() will start returning a real session.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY
) as string | undefined;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  if (!url || !key) return null;
  client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}

export function hasSupabaseEnv(): boolean {
  return Boolean(url && key);
}
