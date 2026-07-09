import Link from 'next/link'
import type { Metadata } from 'next'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import { getMatchdaDict } from '@/lib/matchda/i18n'
import { planOf, FREE_LIMITS, PREMIUM_PRICE_LABEL } from '@/lib/plan'
import UpgradeButton from '@/components/billing/UpgradeButton'
import AppShell from '@/components/matchda/AppShell'
import LandingHeader from '@/components/matchda/landing/LandingHeader'
import SiteFooter from '@/components/matchda/landing/SiteFooter'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '요금제',
  description:
    `무료로 시작해 맞춤 이력서 ${FREE_LIMITS.tailoredResumes}개까지 체험하고, 프리미엄으로 업그레이드하면 채용페이지 등록·맞춤 이력서·커버레터를 무제한으로 이용할 수 있습니다.`,
}

const CHECK = '✓'

const FREE_FEATURES = [
  `채용페이지(공고 회사) ${FREE_LIMITS.jobSources}개까지 등록`,
  `맞춤 이력서 ${FREE_LIMITS.tailoredResumes}개까지 생성`,
  '이력서 번역·잡 탐색·매칭 기본 기능',
]
const PREMIUM_FEATURES = [
  '채용페이지 무제한 등록',
  '맞춤 이력서·영어 번역 무제한',
  '커버레터 무제한 생성',
  '우선 AI 매칭',
]

/** 요금제 카드 2장 — 공개/로그인 화면 공용 */
function PlanCards({ isPremium, authed }: { isPremium: boolean; authed: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {/* 무료 */}
      <div className="rounded-[16px] border border-[#ECEEF0] bg-white p-6">
        <div className="text-[15px] font-bold text-[#1F2A37]">무료</div>
        <div className="mt-1 text-[26px] font-bold text-[#101828]">₩0</div>
        <p className="mt-1 text-xs text-[#98A2B3]">가입하면 바로 사용</p>
        <ul className="mt-5 space-y-2.5">
          {FREE_FEATURES.map(f => (
            <li key={f} className="flex items-start gap-2 text-[13px] text-[#475467]">
              <span className="text-[#98A2B3]">{CHECK}</span> {f}
            </li>
          ))}
        </ul>
        <div className="mt-6">
          {!authed ? (
            <Link
              href="/login?mode=signup"
              className="block rounded-lg border border-[#ECEEF0] bg-white px-5 py-3 text-center text-sm font-semibold text-[#344054] transition-colors hover:border-[#046C4E] hover:text-[#046C4E]"
            >
              무료로 시작하기
            </Link>
          ) : !isPremium ? (
            <div className="rounded-lg bg-[#F4F6F8] px-5 py-3 text-center text-sm font-semibold text-[#667085]">
              현재 이용 중
            </div>
          ) : (
            <div className="rounded-lg bg-[#F4F6F8] px-5 py-3 text-center text-sm text-[#98A2B3]">
              무료 플랜
            </div>
          )}
        </div>
      </div>

      {/* 프리미엄 */}
      <div className="relative rounded-[16px] border-2 border-[#046C4E] bg-white p-6 shadow-[0_4px_20px_rgba(4,108,78,0.1)]">
        <div className="absolute -top-3 right-5 rounded-full bg-[#046C4E] px-3 py-1 text-[11px] font-bold text-white">
          추천
        </div>
        <div className="text-[15px] font-bold text-[#046C4E]">프리미엄</div>
        <div className="mt-1 text-[26px] font-bold text-[#101828]">{PREMIUM_PRICE_LABEL}</div>
        <p className="mt-1 text-xs text-[#98A2B3]">언제든 해지 가능</p>
        <ul className="mt-5 space-y-2.5">
          {PREMIUM_FEATURES.map(f => (
            <li key={f} className="flex items-start gap-2 text-[13px] text-[#344054]">
              <span className="text-[#046C4E]">{CHECK}</span> {f}
            </li>
          ))}
        </ul>
        <div className="mt-6">
          {!authed ? (
            <Link
              href="/login?mode=signup"
              className="block rounded-lg bg-[#046C4E] px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#035A40]"
            >
              프리미엄 시작하기
            </Link>
          ) : isPremium ? (
            <UpgradeButton mode="manage" label="구독 관리" />
          ) : (
            <UpgradeButton mode="upgrade" label="프리미엄 시작하기" />
          )}
        </div>
      </div>
    </div>
  )
}

function PricingBody({
  isPremium,
  authed,
  success,
}: {
  isPremium: boolean
  authed: boolean
  success?: string
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-[#101828]">요금제</h1>
        <p className="mt-1 text-sm text-[#667085]">
          무료로 시작하고, 필요할 때 프리미엄으로 무제한 이용하세요.
        </p>
      </div>

      {success && (
        <div className="mb-6 rounded-lg border border-[#CEEBDC] bg-[#ECFDF3] px-4 py-3 text-sm text-[#046C4E]">
          ✓ 결제가 완료됐어요! 프리미엄 기능이 곧 활성화됩니다.
        </div>
      )}

      <PlanCards isPremium={isPremium} authed={authed} />

      <p className="mt-6 text-center text-xs text-[#98A2B3]">
        결제는 Paddle로 안전하게 처리됩니다. 구독은 고객 포털에서 언제든 해지할 수 있어요.
      </p>
    </div>
  )
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const email = await getAuthUserEmail()
  const { success } = await searchParams

  // 비로그인 — 공개 요금제 (랜딩 크롬)
  if (!email) {
    const t = getMatchdaDict('ko')
    return (
      <div className="min-h-screen bg-white font-[family-name:var(--font-plex-kr)] text-[#111827] antialiased">
        <LandingHeader t={t} />
        <main className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8">
          <PricingBody isPremium={false} authed={false} />
        </main>
        <SiteFooter t={t} />
      </div>
    )
  }

  const profile = await getOrCreateProfile(email)
  const isPremium = planOf(profile) === 'premium'

  return (
    <AppShell activeKey="profile" userName={(profile?.name as string) ?? undefined} userEmail={email}>
      <PricingBody isPremium={isPremium} authed success={success} />
    </AppShell>
  )
}
