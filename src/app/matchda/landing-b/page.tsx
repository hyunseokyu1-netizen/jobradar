import { getMatchdaDict } from '@/lib/matchda/i18n'
import LandingHeader from '@/components/matchda/landing/LandingHeader'
import CenteredHero from '@/components/matchda/landing/CenteredHero'
import FeatureCards from '@/components/matchda/landing/FeatureCards'
import SiteFooter from '@/components/matchda/landing/SiteFooter'

// 랜딩 B (Centered Hero) — 랜딩 A 의 대안 시안. 검색을 화면 중앙에 강조.
// TODO(i18n): 로케일을 쿠키/헤더에서 읽어 전달 (현재 기본 ko)
export default function MatchdaLandingBPage() {
  const t = getMatchdaDict('ko')

  return (
    <div className="min-h-screen bg-white text-[#111827]">
      <LandingHeader t={t} tinted logoHref="/matchda/landing-b" />
      <CenteredHero t={t} />
      <FeatureCards t={t} variant="b" />
      <SiteFooter t={t} />
    </div>
  )
}
