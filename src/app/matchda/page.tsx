import { getMatchdaDict } from '@/lib/matchda/i18n'
import LandingHeader from '@/components/matchda/landing/LandingHeader'
import SplitHero from '@/components/matchda/landing/SplitHero'
import FeatureCards from '@/components/matchda/landing/FeatureCards'
import StatsBand from '@/components/matchda/landing/StatsBand'
import SiteFooter from '@/components/matchda/landing/SiteFooter'

// TODO(i18n): 로케일을 쿠키/헤더에서 읽어 전달 (현재 기본 ko)
export default function MatchdaLandingPage() {
  const t = getMatchdaDict('ko')

  return (
    <div className="min-h-screen bg-white text-[#111827]">
      <LandingHeader t={t} />
      <SplitHero t={t} />
      <FeatureCards t={t} />
      <StatsBand t={t} />
      <SiteFooter t={t} />
    </div>
  )
}
