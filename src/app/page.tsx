import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import RunMatchButton from '@/components/RunMatchButton'
import AddJobForm from '@/components/AddJobForm'
import JobList from '@/components/JobList'

export const dynamic = 'force-dynamic'

import type { JobItem } from '@/components/JobList'

export default async function JobsPage() {
  const email = await getAuthUserEmail()
  const profile = email ? await getOrCreateProfile(email) : null

  if (!profile) return <p className="text-zinc-400 text-center py-20">로그인이 필요합니다.</p>

  const { data: jobs, error } = await supabaseAdmin
    .from('jobs')
    .select(`
      id, source, title, company, location, salary, url, description, posted_at, scraped_at,
      matches!inner ( score, reason, status, memo )
    `)
    .eq('matches.user_id', profile.id)
    .order('scraped_at', { ascending: false })
    .limit(100)

  if (error) return <p className="text-red-500">DB 오류: {error.message}</p>

  const jobList: JobItem[] = (jobs ?? []).map((j: any) => {
    const m = j.matches?.[0]
    return {
      ...j,
      match_score: m?.score ?? null,
      match_reason: m?.reason ?? null,
      match_status: m?.status ?? 'new',
      memo: m?.memo ?? null,
    }
  })

  // 매칭된 것 위로, 같은 그룹 내에서는 점수 높은 순
  const sorted = [...jobList].sort((a, b) => {
    if (a.match_score !== null && b.match_score === null) return -1
    if (a.match_score === null && b.match_score !== null) return 1
    return (b.match_score ?? 0) - (a.match_score ?? 0)
  })

  const matchedCount = jobList.filter(j => j.match_score !== null).length
  const unmatchedCount = jobList.length - matchedCount

  return (
    <div>
      <AddJobForm />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">채용 공고</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            전체 {jobList.length}개 · 매칭됨 {matchedCount}개
            {unmatchedCount > 0 && ` · 미매칭 ${unmatchedCount}개`}
          </p>
        </div>
        <RunMatchButton unmatchedCount={unmatchedCount} />
      </div>

      <JobList initialJobs={sorted} />
    </div>
  )
}
