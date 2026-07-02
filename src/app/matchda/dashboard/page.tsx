import { getMatchdaDict } from '@/lib/matchda/i18n'
import { getDashboardSummary, getKanbanColumns } from '@/lib/matchda/mock-data'
import { getMatchdaDashboard } from '@/lib/matchda/data'
import { getAuthUserEmail } from '@/lib/auth-helpers'
import DashboardScreen from '@/components/matchda/dashboard/DashboardScreen'

export const dynamic = 'force-dynamic'

export default async function MatchdaDashboardPage() {
  const t = getMatchdaDict('ko')

  // 로그인 시 실데이터, 비로그인 시 목업 데모로 폴백
  const [real, userEmail] = await Promise.all([getMatchdaDashboard(), getAuthUserEmail()])
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
      userEmail={userEmail}
    />
  )
}
