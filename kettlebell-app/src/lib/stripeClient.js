import { useState } from 'react';
import { supabase } from './supabaseClient';

const APP_URL = import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');

/**
 * Call Edge Function to create Stripe Checkout session and redirect to Stripe.
 */
export async function createCheckoutSession(email) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { email },
  });
  if (error) throw error;
  if (data?.url) {
    window.location.href = data.url;
  } else {
    throw new Error(data?.error || 'Could not create checkout session');
  }
}

/**
 * Call Edge Function to create Stripe Billing Portal session and redirect.
 */
export async function createPortalSession() {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.functions.invoke('create-portal-session', {
    body: {},
  });
  if (error) throw error;
  if (data?.url) {
    window.location.href = data.url;
  } else {
    throw new Error(data?.error || 'Could not open billing portal');
  }
}

/**
 * Open Stripe Billing Portal (manage subscription, payment method, cancel).
 */
export async function openBillingPortal() {
  await createPortalSession();
}

/**
 * React hook: start checkout for current user. Returns { goToCheckout, loading }.
 */
export function useStripeCheckout() {
  const [loading, setLoading] = useState(false);

  const goToCheckout = async (email) => {
    if (!email) return;
    setLoading(true);
    try {
      await createCheckoutSession(email);
    } catch (err) {
      console.error('Checkout error:', err);
      setLoading(false);
    }
  };

  return { goToCheckout, loading };
}
