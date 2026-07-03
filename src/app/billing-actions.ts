'use server'

import { headers } from 'next/headers'
import { requireStripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'

async function originUrl(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

/**
 * Stripe Checkout 구독 세션 생성 → 결제 페이지 URL 반환.
 * STRIPE_SECRET_KEY, STRIPE_PRICE_ID 환경변수가 필요하다.
 */
export async function createCheckoutSession(): Promise<{ url?: string; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const priceId = process.env.STRIPE_PRICE_ID
  if (!priceId) return { error: '결제 설정(STRIPE_PRICE_ID)이 아직 준비되지 않았습니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  try {
    const stripe = requireStripe()

    // 기존 Stripe 고객 재사용, 없으면 생성 후 프로필에 저장
    let customerId = (profile as { stripe_customer_id?: string | null }).stripe_customer_id ?? undefined
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { profile_id: profile.id },
      })
      customerId = customer.id
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', profile.id)
    }

    const origin = await originUrl()
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: profile.id,
      subscription_data: { metadata: { profile_id: profile.id } },
      success_url: `${origin}/pricing?success=1`,
      cancel_url: `${origin}/pricing?canceled=1`,
      allow_promotion_codes: true,
    })

    return { url: session.url ?? undefined }
  } catch (e) {
    console.error('Checkout session error:', e)
    return { error: '결제 페이지 생성 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.' }
  }
}

/**
 * Stripe 고객 포털 세션 생성 → 구독 관리(취소·결제수단 변경) URL 반환.
 */
export async function createPortalSession(): Promise<{ url?: string; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  const customerId = (profile as { stripe_customer_id?: string | null } | null)?.stripe_customer_id
  if (!customerId) return { error: '구독 정보가 없습니다.' }

  try {
    const stripe = requireStripe()
    const origin = await originUrl()
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/pricing`,
    })
    return { url: session.url }
  } catch (e) {
    console.error('Portal session error:', e)
    return { error: '구독 관리 페이지 생성 중 오류가 발생했어요.' }
  }
}
