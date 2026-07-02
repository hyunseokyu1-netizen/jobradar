import { getAuthUserEmail } from '@/lib/auth-helpers'
import { getMatchdaDict } from '@/lib/matchda/i18n'
import { getMatchdaDashboard } from '@/lib/matchda/data'
import { getDashboardSummary, getKanbanColumns } from '@/lib/matchda/mock-data'
import MatchdaLanding from '@/components/matchda/landing/MatchdaLanding'
import DashboardScreen from '@/components/matchda/dashboard/DashboardScreen'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const email = await getAuthUserEmail()

  // 비로그인 → MatchDa 공개 랜딩 (CTA·검색은 실제 로그인 퍼널로 연결)
  if (!email)
    return (
      <MatchdaLanding
        loginHref="/login"
        signupHref="/login?mode=signup"
        searchHref="/login?mode=signup"
      />
    )

  // 로그인 → MatchDa 대시보드가 실제 홈
  const t = getMatchdaDict('ko')
  const real = await getMatchdaDashboard()
  const summary = real?.summary ?? getDashboardSummary()
  const columns = real?.columns ?? getKanbanColumns()

  return (
    <DashboardScreen
      t={t}
      summary={summary}
      deltas={real?.deltas}
      columns={columns}
      real={!!real}
      unmatchedCount={real?.unmatchedCount ?? 0}
      userEmail={email}
    />
  )
}
