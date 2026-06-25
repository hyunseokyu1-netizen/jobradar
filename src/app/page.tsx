import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import RunMatchButton from '@/components/RunMatchButton'
import AddJobForm from '@/components/AddJobForm'
import JobList from '@/components/JobList'
import MatchdaLanding from '@/components/matchda/landing/MatchdaLanding'

export const dynamic = 'force-dynamic'

import type { JobItem } from '@/components/JobList'

export default async function JobsPage() {
  const email = await getAuthUserEmail()

  // 비로그인 사용자에게는 MatchDa 랜딩 A 노출 (공개 첫 화면)
  if (!email) return <MatchdaLanding authHref="/login" />

  const profile = await getOrCreateProfile(email)
  if (!profile) return <p className="text-zinc-400 text-center py-20">로그인이 필요합니다.</p>

  // 1단계: 유저의 matches 조회
  const { data: myMatches, error: matchError } = await supabaseAdmin
    .from('matches')
    .select('job_id, score, reason, status, memo, applied_resume_text, applied_resume_filename, applied_at, position')
    .eq('user_id', profile.id)

  if (matchError) return <p className="text-red-500">DB 오류: {matchError.message}</p>
  if (!myMatches?.length) return (
    <div>
      <AddJobForm />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">채용 공고</h1>
          <p className="text-sm text-zinc-400 mt-0.5">등록된 공고가 없습니다.</p>
        </div>
      </div>
      <JobList initialJobs={[]} />
    </div>
  )

  const matchMap = new Map(myMatches.map(m => [m.job_id, m]))
  const jobIds = myMatches.map(m => m.job_id)

  // 2단계: job_id 목록으로 jobs 조회
  const { data: jobs, error } = await supabaseAdmin
    .from('jobs')
    .select('id, source, title, company, location, salary, url, description, posted_at, scraped_at')
    .in('id', jobIds)
    .order('scraped_at', { ascending: false })
    .limit(100)

  if (error) return <p className="text-red-500">DB 오류: {error.message}</p>

  const jobList: JobItem[] = (jobs ?? []).map((j: any) => {
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

  // 배열 기본 순서는 사용자 정렬(position) 우선, 없으면 매칭된 것 위로 + 점수 높은 순.
  // (직접 정렬 모드에서 이 배열 순서를 그대로 사용)
  const sorted = [...jobList].sort((a, b) => {
    const pa = a.position ?? Infinity
    const pb = b.position ?? Infinity
    if (pa !== pb) return pa - pb
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
