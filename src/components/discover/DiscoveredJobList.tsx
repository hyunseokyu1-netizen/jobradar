'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { addDiscoveredJobToMyList, dismissDiscoveredJob } from '@/app/discover/actions'
import { matchSingleJob } from '@/app/actions'

export interface DiscoveredJobItem {
  id: string
  source_id: string
  source_name: string
  title: string
  url: string
  location: string | null
  department: string | null
  match_score: number | null
  match_reason: string | null
  status: string
  scraped_at: string
}

type ScoreFilter = 'all' | '70' | '40'

function scoreBadgeClass(score: number | null): string {
  if (score === null) return 'bg-[#F4F6F8] text-[#98A2B3]'
  if (score >= 70) return 'bg-emerald-100 text-emerald-700'
  if (score >= 40) return 'bg-amber-100 text-amber-700'
  return 'bg-[#F4F6F8] text-[#667085]'
}

export default function DiscoveredJobList({ jobs }: { jobs: DiscoveredJobItem[] }) {
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all')
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addingStep, setAddingStep] = useState('')
  const [error, setError] = useState('')
  // 방금 추가한 공고의 jobId (워크스페이스 바로가기 링크용)
  const [addedJobIds, setAddedJobIds] = useState<Record<string, string>>({})

  const router = useRouter()

  const sourceNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const j of jobs) map.set(j.source_id, j.source_name)
    return [...map.entries()]
  }, [jobs])

  const visible = jobs.filter(j => {
    if (sourceFilter !== 'all' && j.source_id !== sourceFilter) return false
    if (scoreFilter !== 'all' && (j.match_score === null || j.match_score < Number(scoreFilter))) return false
    return true
  })

  async function handleAdd(job: DiscoveredJobItem) {
    setAddingId(job.id)
    setError('')

    setAddingStep('등록 중...')
    const res = await addDiscoveredJobToMyList(job.id)
    if (res.error) {
      setAddingId(null)
      setError(res.error)
      return
    }

    if (res.jobId) {
      if (!res.alreadyScraped) {
        setAddingStep('JD 분석 중...')
        await fetch('/api/scrape-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: res.jobId }),
        })
      }
      setAddingStep('AI 정밀 매칭 중...')
      await matchSingleJob(res.jobId)
      setAddedJobIds(prev => ({ ...prev, [job.id]: res.jobId! }))
    }

    setAddingId(null)
    setAddingStep('')
    router.refresh()
  }

  async function handleDismiss(id: string) {
    const res = await dismissDiscoveredJob(id)
    if (res.error) setError(res.error)
    else router.refresh()
  }

  if (jobs.length === 0) {
    return (
      <p className="text-sm text-[#98A2B3] text-center py-12">
        수집된 공고가 없습니다. 채용 페이지를 등록하고 수집을 실행해보세요.
      </p>
    )
  }

  return (
    <div>
      {/* 필터 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex gap-1.5">
          {([['all', '전체'], ['70', '70점+'], ['40', '40점+']] as [ScoreFilter, string][]).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setScoreFilter(v)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                scoreFilter === v
                  ? 'bg-[#046C4E] text-white border-[#046C4E]'
                  : 'bg-white text-[#667085] border-[#ECEEF0] hover:border-[#98A2B3]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {sourceNames.length > 1 && (
          <>
            <span className="text-[#D0D5DB]">|</span>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setSourceFilter('all')}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  sourceFilter === 'all'
                    ? 'bg-[#046C4E] text-white border-[#046C4E]'
                    : 'bg-white text-[#667085] border-[#ECEEF0] hover:border-[#98A2B3]'
                }`}
              >
                모든 회사
              </button>
              {sourceNames.map(([id, name]) => (
                <button
                  key={id}
                  onClick={() => setSourceFilter(id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    sourceFilter === id
                      ? 'bg-[#046C4E] text-white border-[#046C4E]'
                      : 'bg-white text-[#667085] border-[#ECEEF0] hover:border-[#98A2B3]'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </>
        )}
        <span className="text-xs text-[#98A2B3] ml-auto">{visible.length}건</span>
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      {/* 공고 카드 */}
      <div className="space-y-2">
        {visible.map(job => (
          <div
            key={job.id}
            className={`bg-white border border-[#ECEEF0] rounded-xl px-5 py-4 ${
              job.status === 'added' ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-bold rounded-md px-2 py-0.5 ${scoreBadgeClass(job.match_score)}`}
                  >
                    {job.match_score !== null ? `${job.match_score}점` : '미채점'}
                  </span>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold hover:underline truncate"
                  >
                    {job.title}
                  </a>
                </div>
                <p className="text-xs text-[#98A2B3] mt-1">
                  {job.source_name}
                  {job.location ? ` · ${job.location}` : ''}
                  {job.department ? ` · ${job.department}` : ''}
                </p>
                {job.match_reason && (
                  <p className="text-xs text-[#667085] mt-1.5">{job.match_reason}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {job.status === 'added' ? (
                  <span className="flex items-center gap-2 whitespace-nowrap text-xs">
                    <span className="text-green-600">✓ 추가됨</span>
                    <a
                      href={
                        addedJobIds[job.id]
                          ? `/matchda/workspace?jobId=${encodeURIComponent(addedJobIds[job.id])}`
                          : '/'
                      }
                      className="font-semibold text-[#046C4E] hover:underline"
                    >
                      {addedJobIds[job.id] ? '워크스페이스 →' : '공고 관리 →'}
                    </a>
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => handleAdd(job)}
                      disabled={!!addingId}
                      className="text-xs bg-[#046C4E] text-white px-3 py-1.5 rounded-lg hover:bg-[#035A40] disabled:opacity-40 transition-colors whitespace-nowrap"
                    >
                      {addingId === job.id ? addingStep : '+ 지원 관리에 추가'}
                    </button>
                    <button
                      onClick={() => handleDismiss(job.id)}
                      disabled={!!addingId}
                      className="text-xs text-[#B0B7C0] hover:text-[#667085] transition-colors"
                      title="관심 없음"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
