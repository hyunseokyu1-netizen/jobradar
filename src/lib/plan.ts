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

// 결제(Paddle) 연동 여부 — 업그레이드 버튼 노출·문구 분기에 사용
export function billingEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_PADDLE_PRICE_ID
}

// 무료 한도 강제 여부.
// 결제 미연동 공개 기간에도 API 비용 보호를 위해 한도는 항상 강제한다.
// (개발·테스트 등에서 끄려면 DISABLE_FREE_LIMITS=1)
export function limitsEnforced(): boolean {
  return process.env.DISABLE_FREE_LIMITS !== '1'
}

// 한도 초과 시 안내 문구 — 결제 오픈 전에는 업그레이드를 약속하지 않는다
export function limitExceededSuffix(): string {
  return billingEnabled()
    ? '프리미엄으로 업그레이드하면 무제한입니다.'
    : '무료 공개 기간에는 이 한도로 제공돼요. 프리미엄(무제한)은 준비 중입니다.'
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
