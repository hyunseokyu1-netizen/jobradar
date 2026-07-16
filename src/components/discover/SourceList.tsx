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
  /** 반복 실패로 백그라운드 자동 수집이 중지됨 — 수동 수집 성공 시 자동 재개 */
  auto_scrape_paused?: boolean
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
      <p className="text-sm text-[#98A2B3] text-center py-8 border border-dashed border-[#ECEEF0] rounded-xl mb-8">
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
            className="flex items-center gap-2 bg-white border border-[#ECEEF0] rounded-xl px-4 py-2.5"
          >
            <div>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold hover:text-blue-600 hover:underline"
                title="채용 페이지 열기"
              >
                {s.name}
              </a>
              {s.last_scrape_error ? (
                <p className="text-[11px] text-red-500" title={s.last_scrape_error}>
                  수집 불가{s.auto_scrape_paused ? ' · 자동 수집 중지' : ''}
                </p>
              ) : (
                <p className="text-[11px] text-[#98A2B3]">{timeAgo(s.last_scraped_at)}</p>
              )}
            </div>
            <button
              onClick={() => handleScrape(s.id)}
              disabled={!!scrapingId}
              className="text-xs bg-[#046C4E] text-white px-3 py-1.5 rounded-lg hover:bg-[#035A40] disabled:opacity-40 transition-colors ml-2"
            >
              {scrapingId === s.id ? '수집 중...' : '⟳ 수집'}
            </button>
            <button
              onClick={() => handleDelete(s.id, s.name)}
              disabled={!!scrapingId}
              className="text-xs text-[#B0B7C0] hover:text-red-500 transition-colors"
              title="삭제"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {scrapingId && (
        <p className="mt-2 text-xs text-[#667085]">
          <span className="animate-pulse">⟳</span> 페이지 접속 → 공고 추출 → AI 채점 순서로 진행됩니다.
          페이지에 따라 2~3분 걸릴 수 있어요. 이 화면을 유지해주세요.
        </p>
      )}
      {message && <p className="text-xs text-green-600 mt-2">✓ {message}</p>}
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  )
}
