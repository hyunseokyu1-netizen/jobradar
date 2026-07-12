import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUserEmail, getOrCreateProfile } from '@/lib/auth-helpers'
import AddSourceForm from '@/components/discover/AddSourceForm'
import GettingStartedGuide from '@/components/discover/GettingStartedGuide'
import PresetCompanies from '@/components/discover/PresetCompanies'
import SourceList, { type SourceItem } from '@/components/discover/SourceList'
import DiscoveredJobList, { type DiscoveredJobItem } from '@/components/discover/DiscoveredJobList'
import PoolJobList, { type PoolJobItem } from '@/components/discover/PoolJobList'
import AppShell from '@/components/matchda/AppShell'

export const dynamic = 'force-dynamic'
// 수집 서버 액션(scrapeSourceAction)이 이 페이지 라우트에서 실행된다.
// 헤드리스 브라우저 폴백(chromium 콜드스타트 + Cloudflare 챌린지) + Haiku 채점이
// 기본 타임아웃을 넘길 수 있어, /api/scrape와 동일하게 상한을 넉넉히 둔다.
export const maxDuration = 300

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  // 랜딩 히어로 검색바에서 넘어온 초기 검색어
  const { q } = await searchParams
  const initialSearch = (q ?? '').trim()

  const email = await getAuthUserEmail()
  const profile = email ? await getOrCreateProfile(email) : null

  if (!profile) return <p className="text-[#98A2B3] text-center py-20">로그인이 필요합니다.</p>

  const { data: sources, error: sourceError } = await supabaseAdmin
    .from('job_sources')
    .select('id, name, url, source_type, last_scraped_at, last_scrape_error')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: true })

  if (sourceError) return <p className="text-red-500">DB 오류: {sourceError.message}</p>

  const { data: discovered, error: jobError } = await supabaseAdmin
    .from('discovered_jobs')
    .select('id, source_id, title, url, location, department, match_score, match_reason, status, scraped_at')
    .eq('user_id', profile.id)
    .neq('status', 'dismissed')
    .order('match_score', { ascending: false, nullsFirst: false })
    .limit(300)

  if (jobError) return <p className="text-red-500">DB 오류: {jobError.message}</p>

  const sourceNameMap = new Map((sources ?? []).map(s => [s.id, s.name]))
  const jobs: DiscoveredJobItem[] = (discovered ?? []).map(j => ({
    ...j,
    source_name: sourceNameMap.get(j.source_id) ?? '?',
  }))

  // 공유 공고 풀 — 아직 지원현황(matches)에 없는 jobs. '지원 현황에 추가'로 지원현황에 추가
  const { data: myMatches } = await supabaseAdmin
    .from('matches')
    .select('job_id')
    .eq('user_id', profile.id)
  const matchedIds = new Set((myMatches ?? []).map(m => m.job_id))
  const { data: allJobs } = await supabaseAdmin
    .from('jobs')
    .select('id, title, company, location, salary, url, source, scraped_at')
    .order('scraped_at', { ascending: false })
    .limit(300)
  const poolJobs: PoolJobItem[] = (allJobs ?? []).filter(j => !matchedIds.has(j.id))

  return (
    <AppShell activeKey="discover" userName={profile.name as string} userEmail={email}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">잡 탐색</h1>
        <p className="text-sm text-[#98A2B3] mt-0.5">
          관심 회사의 채용 페이지를 등록하면 공고를 수집해 매칭 점수순으로 보여드립니다.
        </p>
      </div>

      {(sources ?? []).length === 0 && (
        <GettingStartedGuide profileDone={!!profile.onboarding_completed} />
      )}

      <AddSourceForm />
      <PresetCompanies />
      <SourceList sources={(sources ?? []) as SourceItem[]} />

      {jobs.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-1 text-base font-semibold text-[#1F2A37]">내 채용페이지 수집 공고</h2>
          <p className="mb-3 text-xs text-[#98A2B3]">
            내가 등록한 채용페이지에서 수집한 공고입니다. 내 이력서 기준 매칭 점수순으로 보여드려요.
          </p>
          <DiscoveredJobList jobs={jobs} initialSearch={initialSearch} />
        </section>
      )}

      <section>
        <h2 className="mb-1 text-base font-semibold text-[#1F2A37]">전체 수집 공고</h2>
        <p className="mb-3 text-xs text-[#98A2B3]">
          매치다에 모인 모든 공고입니다. 마음에 드는 공고를 &quot;지원 현황에 추가&quot;하면 맞춤 이력서·커버레터를 만들 수 있어요.
        </p>
        <PoolJobList jobs={poolJobs} initialSearch={initialSearch} />
      </section>
    </AppShell>
  )
}
