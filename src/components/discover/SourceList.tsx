'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { scrapeSourceAction, deleteJobSource } from '@/app/discover/actions'

export interface SourceItem {
  id: string
  name: string
  url: string
  source_type: string
  last_scraped_at: string | null
  last_scrape_error: string | null
}

const TYPE_LABELS: Record<string, string> = {
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  ashby: 'Ashby',
  smartrecruiters: 'SmartRecruiters',
  generic: 'AI 추출',
}

function timeAgo(iso: string | null): string {
  if (!iso) return '수집 전'
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return '방금 수집'
  if (hours < 24) return `${hours}시간 전 수집`
  return `${Math.floor(hours / 24)}일 전 수집`
}

export default function SourceList({ sources }: { sources: SourceItem[] }) {
  const [scrapingId, setScrapingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const router = useRouter()

  async function handleScrape(id: string) {
    setScrapingId(id)
    setMessage('')
    setError('')
    const res = await scrapeSourceAction(id)
    setScrapingId(null)
    if (res.error) {
      setError(res.error)
      return
    }
    setMessage(`공고 ${res.found}건 확인 · 신규 ${res.added}건 · AI 채점 ${res.scored}건`)
    router.refresh()
    setTimeout(() => setMessage(''), 5000)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" 페이지와 수집된 공고를 모두 삭제할까요?`)) return
    const res = await deleteJobSource(id)
    if (res.error) setError(res.error)
    else router.refresh()
  }

  if (sources.length === 0) {
    return (
      <p className="text-sm text-zinc-400 text-center py-8 border border-dashed border-zinc-200 rounded-xl mb-8">
        등록된 채용 페이지가 없습니다. 위에서 관심 있는 회사의 채용 페이지를 등록해보세요.
      </p>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2">
        {sources.map(s => (
          <div
            key={s.id}
            className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-4 py-2.5"
          >
            <div>
              <div className="flex items-center gap-2">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold hover:text-blue-600 hover:underline"
                  title="채용 페이지 열기"
                >
                  {s.name}
                </a>
                <span className="text-[10px] text-zinc-400 border border-zinc-200 rounded px-1 py-px">
                  {TYPE_LABELS[s.source_type] ?? s.source_type}
                </span>
              </div>
              {s.last_scrape_error ? (
                <p className="text-[11px] text-red-500" title={s.last_scrape_error}>
                  수집 불가
                </p>
              ) : (
                <p className="text-[11px] text-zinc-400">{timeAgo(s.last_scraped_at)}</p>
              )}
            </div>
            <button
              onClick={() => handleScrape(s.id)}
              disabled={!!scrapingId}
              className="text-xs bg-zinc-900 text-white px-3 py-1.5 rounded-lg hover:bg-zinc-700 disabled:opacity-40 transition-colors ml-2"
            >
              {scrapingId === s.id ? '수집 중...' : '⟳ 수집'}
            </button>
            <button
              onClick={() => handleDelete(s.id, s.name)}
              disabled={!!scrapingId}
              className="text-xs text-zinc-300 hover:text-red-500 transition-colors"
              title="삭제"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {message && <p className="text-xs text-green-600 mt-2">✓ {message}</p>}
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  )
}
