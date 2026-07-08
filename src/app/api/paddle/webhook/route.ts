import { NextResponse } from 'next/server'
import { EventName, type SubscriptionNotification, type SubscriptionCreatedNotification } from '@paddle/paddle-node-sdk'
import { requirePaddle } from '@/lib/paddle'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// 구독 상태를 프로필에 반영 (Created/그 외 이벤트가 서로 다른 알림 타입을 쓰지만 필요한 필드는 동일)
async function applySubscription(sub: SubscriptionNotification | SubscriptionCreatedNotification) {
  const customerId = sub.customerId
  const profileId = typeof sub.customData?.profile_id === 'string' ? sub.customData.profile_id : undefined
  const status = sub.status
  const active = status === 'active' || status === 'trialing'
  const periodEnd = sub.currentBillingPeriod?.endsAt ?? null

  const patch = {
    plan: active ? 'premium' : 'free',
    subscription_status: status,
    paddle_subscription_id: sub.id,
    paddle_customer_id: customerId,
    current_period_end: periodEnd ? new Date(periodEnd).toISOString() : null,
    updated_at: new Date().toISOString(),
  }

  // profile_id(customData) 우선, 없으면 paddle_customer_id로 매칭
  const query = supabaseAdmin.from('profiles').update(patch)
  if (profileId) await query.eq('id', profileId)
  else await query.eq('paddle_customer_id', customerId)
}

export async function POST(request: Request) {
  const paddle = (() => {
    try { return requirePaddle() } catch { return null }
  })()
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET
  if (!paddle || !webhookSecret) {
    return NextResponse.json({ error: 'Paddle not configured' }, { status: 503 })
  }

  const signature = request.headers.get('paddle-signature')
  const body = await request.text()

  let event: Awaited<ReturnType<typeof paddle.webhooks.unmarshal>>
  try {
    event = await paddle.webhooks.unmarshal(body, webhookSecret, signature ?? '')
  } catch (e) {
    console.error('Webhook signature verification failed:', e)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.eventType) {
      case EventName.SubscriptionCreated:
      case EventName.SubscriptionUpdated:
      case EventName.SubscriptionCanceled:
      case EventName.SubscriptionActivated:
      case EventName.SubscriptionPastDue:
      case EventName.SubscriptionPaused:
      case EventName.SubscriptionResumed:
      case EventName.SubscriptionTrialing:
        await applySubscription(event.data)
        break
      default:
        break
    }
  } catch (e) {
    console.error('Webhook handler error:', e)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
