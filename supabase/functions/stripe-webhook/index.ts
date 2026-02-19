import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig || !WEBHOOK_SECRET) {
    return new Response('Webhook secret missing', { status: 400 });
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${(err as Error).message}`, { status: 400 });
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const subId = session.subscription as string;
        if (!userId || !subId) break;
        const subscription = await stripe.subscriptions.retrieve(subId);
        const customerId = String(subscription.customer);
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'stripe_subscription_id' });
        await supabase.from('profiles').update({ is_pro: true, updated_at: new Date().toISOString() }).eq('id', userId);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const { data: existing } = await supabase.from('subscriptions').select('user_id').eq('stripe_subscription_id', subscription.id).single();
        if (!existing) break;
        await supabase.from('subscriptions').update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', subscription.id);
        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        await supabase.from('profiles').update({ is_pro: isActive, updated_at: new Date().toISOString() }).eq('id', existing.user_id);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await supabase.from('subscriptions').update({ status: 'canceled', updated_at: new Date().toISOString() }).eq('stripe_subscription_id', subscription.id);
        const { data: row } = await supabase.from('subscriptions').select('user_id').eq('stripe_subscription_id', subscription.id).single();
        if (row) {
          await supabase.from('profiles').update({ is_pro: false, updated_at: new Date().toISOString() }).eq('id', row.user_id);
        }
        break;
      }
      case 'invoice.paid':
      case 'invoice.payment_failed':
        // Optional: update subscription period from invoice if needed
        break;
      default:
        break;
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return new Response('Webhook handler failed', { status: 500 });
  }
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
