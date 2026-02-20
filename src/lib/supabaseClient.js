import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Auth storage adapter for PWA/standalone (home screen).
 * - Uses localStorage when available; Supabase auth-js awaits getItem/setItem/removeItem, so we return Promises.
 * - If localStorage throws (e.g. quota, iOS standalone quirks), falls back to in-memory so sign-in can still complete for the current tab.
 */
function getAuthStorage() {
  if (typeof window === 'undefined') return undefined;
  const memory = new Map();
  try {
    const storage = window.localStorage;
    return {
      getItem: (key) =>
        Promise.resolve().then(() => {
          try {
            const v = storage.getItem(key);
            if (v != null) return v;
            return memory.get(key) ?? null;
          } catch (_) {
            return memory.get(key) ?? null;
          }
        }),
      setItem: (key, value) =>
        Promise.resolve().then(() => {
          try {
            storage.setItem(key, value);
          } catch (_) {
            memory.set(key, value);
          }
        }),
      removeItem: (key) =>
        Promise.resolve().then(() => {
          try {
            storage.removeItem(key);
          } catch (_) {}
          memory.delete(key);
        }),
    };
  } catch (_) {
    return {
      getItem: (key) => Promise.resolve(memory.get(key) ?? null),
      setItem: (key, value) => Promise.resolve(memory.set(key, value)),
      removeItem: (key) => Promise.resolve(memory.delete(key)),
    };
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
          flowType: 'pkce',
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
