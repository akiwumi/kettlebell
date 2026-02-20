import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Storage adapter that works in PWA/standalone (home screen) on iOS/Android. */
function getAuthStorage() {
  if (typeof window === 'undefined') return undefined;
  try {
    const storage = window.localStorage;
    return {
      getItem: (key) => storage.getItem(key),
      setItem: (key, value) => { storage.setItem(key, value); },
      removeItem: (key) => { storage.removeItem(key); },
    };
  } catch (_) {
    return undefined;
  }
}

const authStorage = getAuthStorage();
const authOptions =
  authStorage && supabaseUrl && supabaseAnonKey
    ? {
        auth: {
          storage: authStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    : undefined;

/**
 * Supabase client. Required for auth and data.
 * Uses explicit auth storage when available so session persists in PWA/standalone (home screen) mode.
 */
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, authOptions || {})
    : null;

export const hasSupabase = () => !!supabase;
