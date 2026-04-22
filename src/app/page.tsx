import { supabaseAdmin } from '@/lib/supabase-admin'
import RunMatchButton from '@/components/RunMatchButton'

interface JobWithMatch {
  id: string
  source: string
  title: string
  company: string
  location: string
  salary: string | null
  url: string
  posted_at: string | null
  scraped_at: string
  match_score: number | null
  match_reason: string | null
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  const h = Math.floor(diff / 3600000)
  if (d > 0) return `${d}일 전`
  if (h > 0) return `${h}시간 전`
  return '방금'
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-zinc-300">미매칭</span>
  const color = score >= 70 ? 'bg-green-100 text-green-700' : score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-zinc-100 text-zinc-500'
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{score}점</span>
}

export default async function JobsPage() {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', 'hyunseok.yu1@gmail.com')
    .single()

  // jobs + matches 조인
  const { data: jobs, error } = await supabaseAdmin
    .from('jobs')
    .select(`
      id, source, title, company, location, salary, url, posted_at, scraped_at,
      matches!left ( score, reason, user_id )
    `)
    .order('scraped_at', { ascending: false })
    .limit(100)

  if (error) return <p className="text-red-500">DB 오류: {error.message}</p>

  const jobList: JobWithMatch[] = (jobs ?? []).map((j: any) => {
    const myMatch = j.matches?.find((m: any) => m.user_id === profile?.id)
    return {
      ...j,
      match_score: myMatch?.score ?? null,
      match_reason: myMatch?.reason ?? null,
    }
  })

  const matchedCount = jobList.filter(j => j.match_score !== null).length
  const unmatchedCount = jobList.length - matchedCount

  return (
    <div>
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

      {!jobList.length ? (
        <p className="text-zinc-400 text-center py-20">아직 스크래핑된 공고가 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {jobList.map((job) => (
            <li key={job.id} className="bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-300 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      job.source === 'seek' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {job.source}
                    </span>
                    <ScoreBadge score={job.match_score} />
                    <span className="text-xs text-zinc-400">
                      {job.posted_at ? timeAgo(job.posted_at) : timeAgo(job.scraped_at)}
                    </span>
                  </div>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-zinc-900 hover:text-blue-600 leading-snug block truncate"
                  >
                    {job.title}
                  </a>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {job.company}
                    {job.location && <> · {job.location}</>}
                    {job.salary && <> · <span className="text-green-600">{job.salary}</span></>}
                  </p>
                  {job.match_reason && (
                    <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2">{job.match_reason}</p>
                  )}
                </div>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs border border-zinc-200 rounded-lg px-3 py-1.5 hover:bg-zinc-50"
                >
                  보기 →
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
