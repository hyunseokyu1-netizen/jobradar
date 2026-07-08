// 요금제(무료/프리미엄) 정의 및 무료 사용 한도.

export type Plan = 'free' | 'premium'

// 무료 플랜 한도
export const FREE_LIMITS = {
  /** 등록 가능한 채용페이지(공고 회사) 수 */
  jobSources: 5,
  /** 생성 가능한 맞춤 이력서 수 */
  tailoredResumes: 2,
} as const

export const PREMIUM_PRICE_LABEL = '$7.99 / 월'

// 결제(구독)가 설정된 환경에서만 무료 한도를 적용한다.
// NEXT_PUBLIC_PADDLE_PRICE_ID 가 없으면 업그레이드 경로가 없으므로 한도를 강제하지 않는다.
export function billingEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_PADDLE_PRICE_ID
}

/** profile row에서 현재 플랜을 판정 (구독 활성 상태면 premium) */
export function planOf(profile: {
  plan?: string | null
  subscription_status?: string | null
} | null | undefined): Plan {
  if (!profile) return 'free'
  const active = profile.subscription_status === 'active' || profile.subscription_status === 'trialing'
  if (profile.plan === 'premium' && active) return 'premium'
  // subscription_status 미도입 환경 호환: plan만 premium이면 인정
  if (profile.plan === 'premium' && profile.subscription_status == null) return 'premium'
  return 'free'
}

export function isPremium(profile: Parameters<typeof planOf>[0]): boolean {
  return planOf(profile) === 'premium'
}
