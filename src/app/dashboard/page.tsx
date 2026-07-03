import { redirect } from 'next/navigation'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getMatchdaDict } from '@/lib/matchda/i18n'
import { getMatchdaDashboard } from '@/lib/matchda/data'
import { getDashboardSummary, getKanbanColumns } from '@/lib/matchda/mock-data'
import DashboardScreen from '@/components/matchda/dashboard/DashboardScreen'
import type { JobItem } from '@/components/JobList'

export const dynamic = 'force-dynamic'

// 리스트 뷰용 공고 데이터 (구 채용 공고 리스트와 동일한 조립)
async function getListJobs(profileId: string): Promise<JobItem[]> {
  const { data: myMatches } = await supabaseAdmin
    .from('matches')
    .select('job_id, score, reason, status, memo, applied_resume_text, applied_resume_filename, applied_at, position')
    .eq('user_id', profileId)
  if (!myMatches?.length) return []

  const matchMap = new Map(myMatches.map(m => [m.job_id, m]))
  const { data: jobs } = await supabaseAdmin
    .from('jobs')
    .select('id, source, title, company, location, salary, url, description, posted_at, scraped_at')
    .in('id', myMatches.map(m => m.job_id))
    .order('scraped_at', { ascending: false })
    .limit(100)

  const list: JobItem[] = (jobs ?? []).map(j => {
    const m = matchMap.get(j.id)
    return {
      ...j,
      match_score: m?.score ?? null,
      match_reason: m?.reason ?? null,
      match_status: m?.status ?? 'new',
      memo: m?.memo ?? null,
      applied_resume_text: m?.applied_resume_text ?? null,
      applied_resume_filename: m?.applied_resume_filename ?? null,
      applied_at: m?.applied_at ?? null,
      position: m?.position ?? null,
    }
  })

  // 사용자 정렬(position) 우선, 없으면 매칭된 것 위로 + 점수 높은 순
  return list.sort((a, b) => {
    const pa = a.position ?? Infinity
    const pb = b.position ?? Infinity
    if (pa !== pb) return pa - pb
    if (a.match_score !== null && b.match_score === null) return -1
    if (a.match_score === null && b.match_score !== null) return 1
    return (b.match_score ?? 0) - (a.match_score ?? 0)
  })
}

export default async function DashboardPage() {
  const email = await getAuthUserEmail()
  if (!email) redirect('/login')

  const t = getMatchdaDict('ko')
  const profile = await getOrCreateProfile(email)
  const real = await getMatchdaDashboard()
  const summary = real?.summary ?? getDashboardSummary()
  const columns = real?.columns ?? getKanbanColumns()
  const listJobs = real && profile ? await getListJobs(profile.id) : undefined

  return (
    <DashboardScreen
      t={t}
      summary={summary}
      deltas={real?.deltas}
      columns={columns}
      real={!!real}
      unmatchedCount={real?.unmatchedCount ?? 0}
      userEmail={email}
      needsOnboarding={!profile?.onboarding_completed}
      listJobs={listJobs}
    />
  )
}
