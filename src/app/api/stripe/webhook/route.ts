import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { requireStripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// 구독 상태를 프로필에 반영
async function applySubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const profileId = sub.metadata?.profile_id
  const status = sub.status
  const active = status === 'active' || status === 'trialing'
  const periodEnd = sub.items.data[0]?.current_period_end ?? null

  const patch = {
    plan: active ? 'premium' : 'free',
    subscription_status: status,
    stripe_subscription_id: sub.id,
    stripe_customer_id: customerId,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }

  // profile_id(metadata) 우선, 없으면 stripe_customer_id로 매칭
  const query = supabaseAdmin.from('profiles').update(patch)
  if (profileId) await query.eq('id', profileId)
  else await query.eq('stripe_customer_id', customerId)
}

export async function POST(request: Request) {
  const stripe = (() => {
    try { return requireStripe() } catch { return null }
  })()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const sig = request.headers.get('stripe-signature')
  const body = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig ?? '', webhookSecret)
  } catch (e) {
    console.error('Webhook signature verification failed:', e)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.subscription) {
          const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
          const sub = await stripe.subscriptions.retrieve(subId)
          if (!sub.metadata?.profile_id && session.client_reference_id) {
            sub.metadata = { ...sub.metadata, profile_id: session.client_reference_id }
          }
          await applySubscription(sub)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await applySubscription(event.data.object as Stripe.Subscription)
        break
      }
      default:
        break
    }
  } catch (e) {
    console.error('Webhook handler error:', e)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
