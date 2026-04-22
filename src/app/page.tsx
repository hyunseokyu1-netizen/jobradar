import { supabaseAdmin } from '@/lib/supabase-admin'

interface Job {
  id: string
  source: string
  title: string
  company: string
  location: string
  salary: string | null
  url: string
  posted_at: string | null
  scraped_at: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}일 전`
  if (h > 0) return `${h}시간 전`
  return '방금'
}

export default async function JobsPage() {
  const { data: jobs, error } = await supabaseAdmin
    .from('jobs')
    .select('id, source, title, company, location, salary, url, posted_at, scraped_at')
    .order('scraped_at', { ascending: false })
    .limit(100)

  if (error) {
    return <p className="text-red-500">DB 오류: {error.message}</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">채용 공고</h1>
        <span className="text-sm text-zinc-500">{jobs?.length ?? 0}개</span>
      </div>

      {!jobs?.length ? (
        <p className="text-zinc-400 text-center py-20">아직 스크래핑된 공고가 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job: Job) => (
            <li key={job.id} className="bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-400 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      job.source === 'seek'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {job.source}
                    </span>
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
