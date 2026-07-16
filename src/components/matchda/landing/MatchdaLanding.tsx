import { getMatchdaDict } from '@/lib/matchda/i18n'
import LandingHeader from './LandingHeader'
import SplitHero from './SplitHero'
import WorkspaceShowcase from './WorkspaceShowcase'
import DiscoverShowcase from './DiscoverShowcase'
import ApplicationsShowcase from './ApplicationsShowcase'
import FeatureCards from './FeatureCards'
import TestimonialsSection from './TestimonialsSection'
import StatsBand from './StatsBand'
import SiteFooter from './SiteFooter'
import type { PublicTestimonial } from '@/lib/matchda/data'

/**
 * MatchDa 랜딩 A (Split Hero) 전체 화면.
 * /matchda(데모)와 / (공개 랜딩) 양쪽에서 재사용한다.
 * 폰트 변수는 루트 <html>에 있으므로 wrapper 에서 IBM Plex 를 적용해
 * MatchDa 레이아웃을 거치지 않는 / 경로에서도 동일하게 보이게 한다.
 *
 * 링크 목적지 기본값은 디자인 데모(/matchda/*)를 가리키며,
 * 공개 랜딩(/)에서는 실제 로그인 퍼널로 오버라이드한다.
 */
export default function MatchdaLanding({
  authed = false,
  loginHref,
  signupHref,
  searchHref,
  userName,
  userEmail,
  testimonials = [],
}: {
  /** 로그인 상태면 쇼케이스 CTA·검색 목적지를 실제 앱으로 바꾼다 */
  authed?: boolean
  /** 로그인 버튼 목적지 (공개 랜딩은 /login) */
  loginHref?: string
  /** 무료로 시작하기 목적지 (공개 랜딩은 /login?mode=signup) */
  signupHref?: string
  /** 검색 제출 목적지 (공개 랜딩은 /login?mode=signup) */
  searchHref?: string
  /** 로그인 유저 이름 — 헤더 아바타 표시용 */
  userName?: string | null
  /** 로그인 유저 이메일 — 있으면 헤더가 유저 정보를 표시 */
  userEmail?: string | null
  /** 공개 동의 실후기 — 비어있으면 섹션이 '예시' 라벨 샘플로 폴백 */
  testimonials?: PublicTestimonial[]
}) {
  // TODO(i18n): 로케일을 쿠키/헤더에서 읽어 전달 (현재 기본 ko)
  const t = getMatchdaDict('ko')

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-plex-kr)] text-[#111827] antialiased">
      <LandingHeader t={t} loginHref={loginHref} signupHref={signupHref} userName={userName} userEmail={userEmail} />
      <SplitHero t={t} searchHref={searchHref} />
      <WorkspaceShowcase ctaHref={authed ? '/profile' : signupHref ?? '/login?mode=signup'} />
      <DiscoverShowcase />
      <ApplicationsShowcase />
      <FeatureCards t={t} authed={authed} />
      <TestimonialsSection items={testimonials} />
      <StatsBand t={t} />
      <SiteFooter t={t} />
    </div>
  )
}
