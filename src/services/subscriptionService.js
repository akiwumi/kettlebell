import { supabase } from '../lib/supabaseClient';

/**
 * Fetch active subscription for user. Used by AuthContext to derive isPro.
 */
export async function getActiveSubscription(userId) {
  if (!supabase || !userId) return null;
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .order('current_period_end', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}
