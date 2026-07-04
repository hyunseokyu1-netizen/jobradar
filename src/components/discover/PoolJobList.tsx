'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addJobToApplications } from '@/app/discover/actions'
import { Search } from '@/components/matchda/ui/icons'

export interface PoolJobItem {
  id: string
  title: string
  company: string
  location: string | null
  salary: string | null
  url: string
  source: string
  scraped_at: string
}

type SortKey = 'recent' | 'oldest' | 'company'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  const h = Math.floor(diff / 3600000)
  if (d > 0) return `${d}일 전`
  if (h > 0) return `${h}시간 전`
  return '방금'
}

/**
 * 잡 탐색 — 공유 공고 풀(아직 지원현황에 없는 jobs). '관리 보내기'로 지원현황에 추가.
 */
export default function PoolJobList({
  jobs,
  initialSearch = '',
}: {
  jobs: PoolJobItem[]
  initialSearch?: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [sort, setSort] = useState<SortKey>('recent')
  const [addingId, setAddingId] = useState<string | null>(null)
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  const q = search.trim().toLowerCase()
  const visible = jobs
    .filter(j => {
      if (!q) return true
      return `${j.title} ${j.company} ${j.location ?? ''}`.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sort === 'company') return a.company.localeCompare(b.company)
      const ta = new Date(a.scraped_at).getTime()
      const tb = new Date(b.scraped_at).getTime()
      return sort === 'oldest' ? ta - tb : tb - ta
    })

  async function handleSend(job: PoolJobItem) {
    setAddingId(job.id)
    setError('')
    const res = await addJobToApplications(job.id)
    setAddingId(null)
    if (res.error) {
      setError(res.error)
      return
    }
    setSentIds(prev => new Set(prev).add(job.id))
    router.refresh()
  }

  if (jobs.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-[#98A2B3]">
        수집된 공고가 없습니다. 채용 페이지를 등록하고 수집을 실행해보세요.
      </p>
    )
  }

  return (
    <div>
      {/* 검색 + 정렬 */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="공고·회사·지역 검색"
            className="w-full rounded-lg border border-[#ECEEF0] bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[#046C4E]"
          />
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          className="rounded-lg border border-[#ECEEF0] bg-white px-3 py-2 text-sm text-[#344054] outline-none transition-colors focus:border-[#046C4E]"
        >
          <option value="recent">최신순</option>
          <option value="oldest">오래된순</option>
          <option value="company">회사명순</option>
        </select>
        <span className="ml-auto text-xs text-[#98A2B3]">{visible.length}건</span>
      </div>

      {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

      <div className="space-y-2">
        {visible.map(job => {
          const sent = sentIds.has(job.id)
          return (
            <div
              key={job.id}
              className={`rounded-xl border border-[#ECEEF0] bg-white px-5 py-4 ${sent ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-sm font-semibold hover:underline"
                  >
                    {job.title}
                  </a>
                  <p className="mt-1 text-xs text-[#98A2B3]">
                    {job.company}
                    {job.location ? ` · ${job.location}` : ''}
                    {job.salary ? ` · ${job.salary}` : ''}
                    <span className="ml-1 text-[#C4CAD2]">· {job.source} · {timeAgo(job.scraped_at)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  disabled={addingId === job.id || sent}
                  onClick={() => handleSend(job)}
                  className={`shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                    sent
                      ? 'bg-[#ECFDF3] text-[#046C4E]'
                      : 'bg-[#046C4E] text-white hover:bg-[#035A40] disabled:opacity-50'
                  }`}
                >
                  {sent ? '✓ 보냄' : addingId === job.id ? '보내는 중…' : '관리 보내기'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
