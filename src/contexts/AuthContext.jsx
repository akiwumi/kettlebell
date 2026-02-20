import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  const isEmailVerified = !!user?.email_confirmed_at;

  /** Map DB profile (display_name, photo_url) to app shape (full_name, avatar_url). */
  function mapProfileFromDb(data) {
    if (!data) return null;
    return {
      ...data,
      full_name: data.full_name ?? data.display_name,
      avatar_url: data.avatar_url ?? data.photo_url,
    };
  }

  async function loadProfile(userId) {
    if (!supabase || !userId) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(mapProfileFromDb(data) || null);
    setIsPro(!!data?.is_pro);
  }

  async function refreshSubscriptionStatus(userId) {
    if (!supabase || !userId) {
      setIsPro(false);
      return;
    }
    const { data } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('current_period_end', { ascending: false })
      .limit(1)
      .maybeSingle();
    const active = data?.status === 'active' || data?.status === 'trialing';
    setIsPro(active);
    setProfile((p) => (p ? { ...p, is_pro: active } : null));
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user?.id) {
        loadProfile(s.user.id).then(() => refreshSubscriptionStatus(s.user.id));
      } else {
        setProfile(null);
        setIsPro(false);
      }
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user?.id) {
        await loadProfile(s.user.id);
        await refreshSubscriptionStatus(s.user.id);
      } else {
        setProfile(null);
        setIsPro(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signUp(email, password, metadata = {}) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata.full_name ?? metadata.name ?? '',
          avatar_url: metadata.avatar_url ?? '',
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (!error && data?.user) await loadProfile(data.user.id);
    return { data, error };
  }

  async function signIn(email, password) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data?.user) await loadProfile(data.user.id);
    return { data, error };
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsPro(false);
  }

  async function resetPassword(email) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
  }

  async function updatePassword(newPassword) {
    if (!supabase || !user?.id) return { error: { message: 'Not authenticated' } };
    return supabase.auth.updateUser({ password: newPassword });
  }

  async function updateProfile(data) {
    if (!supabase || !user?.id) return { error: { message: 'Not authenticated' } };
    const payload = { ...data, updated_at: new Date().toISOString() };
    if ('full_name' in payload) {
      payload.display_name = payload.full_name;
      delete payload.full_name;
    }
    if ('avatar_url' in payload) {
      payload.photo_url = payload.avatar_url;
      delete payload.avatar_url;
    }
    const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
    if (!error) await loadProfile(user.id);
    return { error };
  }

  const value = {
    user,
    session,
    profile,
    isPro,
    isEmailVerified,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshSubscriptionStatus: () => user?.id && refreshSubscriptionStatus(user.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
