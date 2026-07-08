'use server'

import { requirePaddle } from '@/lib/paddle'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'

/**
 * 결제 오버레이(Paddle.js)를 여는 데 필요한 최소 정보.
 * Paddle Billing은 서버에서 체크아웃 세션 URL을 미리 만들 필요 없이,
 * 클라이언트에서 Paddle.Checkout.open()을 직접 호출하는 방식이다.
 */
export async function getBillingContext(): Promise<{ email?: string; profileId?: string; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  if (!profile) return { error: 'Profile not found' }

  return { email, profileId: profile.id }
}

/**
 * Paddle 고객 포털 세션 생성 → 구독 관리(취소·결제수단 변경) URL 반환.
 */
export async function createPortalSession(): Promise<{ url?: string; error?: string }> {
  const email = await getAuthUserEmail()
  if (!email) return { error: '로그인이 필요합니다.' }

  const profile = await getOrCreateProfile(email)
  const customerId = (profile as { paddle_customer_id?: string | null } | null)?.paddle_customer_id
  const subscriptionId = (profile as { paddle_subscription_id?: string | null } | null)?.paddle_subscription_id
  if (!customerId || !subscriptionId) return { error: '구독 정보가 없습니다.' }

  try {
    const paddle = requirePaddle()
    const session = await paddle.customerPortalSessions.create(customerId, [subscriptionId])
    return { url: session.urls.general.overview }
  } catch (e) {
    console.error('Portal session error:', e)
    return { error: '구독 관리 페이지 생성 중 오류가 발생했어요.' }
  }
}
