'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  addDiscoveredJobToMyList,
  dismissDiscoveredJob,
  dismissDiscoveredJobs,
  rescoreDiscoveredJob,
} from '@/app/discover/actions'
import { matchSingleJob } from '@/app/actions'
import { Search } from '@/components/matchda/ui/icons'

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

type ScoreFilter = 'all' | '70' | '40' | 'unscored'
type SortKey = 'recent' | 'score' | 'oldest'

function scoreBadgeClass(score: number | null): string {
  if (score === null) return 'bg-[#F4F6F8] text-[#98A2B3]'
  if (score >= 70) return 'bg-emerald-100 text-emerald-700'
  if (score >= 40) return 'bg-amber-100 text-amber-700'
  return 'bg-[#F4F6F8] text-[#667085]'
}

export default function DiscoveredJobList({
  jobs,
  initialSearch = '',
}: {
  jobs: DiscoveredJobItem[]
  initialSearch?: string
}) {
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  // 기본은 "나와 맞는 공고"(40점+)만 — 미채점·저점수 공고는 필터로 직접 선택해야 보인다
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('40')
  const [search, setSearch] = useState(initialSearch)
  const [sort, setSort] = useState<SortKey>('recent')
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addingStep, setAddingStep] = useState('')
  const [error, setError] = useState('')
  // 방금 추가한 공고의 jobId (워크스페이스 바로가기 링크용)
  const [addedJobIds, setAddedJobIds] = useState<Record<string, string>>({})
  // 편집 모드 (체크박스 다중 선택 삭제)
  const [editMode, setEditMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  // 개별 채점 중인 공고 id
  const [scoringId, setScoringId] = useState<string | null>(null)

  const router = useRouter()

  const sourceNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const j of jobs) map.set(j.source_id, j.source_name)
    return [...map.entries()]
  }, [jobs])

  const q = search.trim().toLowerCase()
  const visible = jobs
    .filter(j => {
      if (sourceFilter !== 'all' && j.source_id !== sourceFilter) return false
      if (scoreFilter === 'unscored') {
        if (j.match_score !== null) return false
      } else if (scoreFilter !== 'all' && (j.match_score === null || j.match_score < Number(scoreFilter))) {
        return false
      }
      if (q) {
        const hay = `${j.title} ${j.source_name} ${j.location ?? ''} ${j.department ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    .sort((a, b) => {
      if (sort === 'score') return (b.match_score ?? -1) - (a.match_score ?? -1)
      const ta = new Date(a.scraped_at).getTime()
      const tb = new Date(b.scraped_at).getTime()
      return sort === 'oldest' ? ta - tb : tb - ta
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

  function toggleSelected(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    const selectable = visible.filter(j => j.status !== 'added').map(j => j.id)
    setSelected(prev => (prev.size >= selectable.length ? new Set() : new Set(selectable)))
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return
    setBulkDeleting(true)
    setError('')
    const res = await dismissDiscoveredJobs([...selected])
    setBulkDeleting(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setSelected(new Set())
    setEditMode(false)
    router.refresh()
  }

  async function handleRescore(id: string) {
    setScoringId(id)
    setError('')
    const res = await rescoreDiscoveredJob(id)
    setScoringId(null)
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
      {/* 검색 + 정렬 */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[200px]">
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
          <option value="score">매칭 점수순</option>
        </select>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex gap-1.5">
          {([['all', '전체'], ['70', '70점+'], ['40', '40점+'], ['unscored', '미채점']] as [ScoreFilter, string][]).map(([v, label]) => (
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
        <button
          onClick={() => {
            setEditMode(m => !m)
            setSelected(new Set())
          }}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            editMode
              ? 'bg-[#1F2A37] text-white border-[#1F2A37]'
              : 'bg-white text-[#667085] border-[#ECEEF0] hover:border-[#98A2B3]'
          }`}
        >
          {editMode ? '편집 완료' : '편집'}
        </button>
      </div>

      {/* 편집 모드 툴바 */}
      {editMode && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-[#ECEEF0] bg-[#F7F8FA] px-4 py-2.5">
          <button onClick={toggleSelectAll} className="text-xs font-medium text-[#344054] hover:text-[#046C4E]">
            전체 선택/해제
          </button>
          <span className="text-xs text-[#98A2B3]">{selected.size}개 선택됨</span>
          <button
            onClick={handleBulkDelete}
            disabled={selected.size === 0 || bulkDeleting}
            className="ml-auto rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-40"
          >
            {bulkDeleting ? '삭제 중…' : `선택 삭제 (${selected.size})`}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      {/* 공고 카드 */}
      <div className="space-y-2">
        {visible.map(job => (
          <div
            key={job.id}
            onClick={editMode && job.status !== 'added' ? () => toggleSelected(job.id) : undefined}
            className={`bg-white border rounded-xl px-5 py-4 ${
              job.status === 'added' ? 'opacity-60' : ''
            } ${
              editMode && selected.has(job.id)
                ? 'border-[#046C4E] bg-[#ECFDF3]/40 cursor-pointer'
                : editMode && job.status !== 'added'
                  ? 'border-[#ECEEF0] cursor-pointer hover:border-[#98A2B3]'
                  : 'border-[#ECEEF0]'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              {editMode && (
                <input
                  type="checkbox"
                  checked={selected.has(job.id)}
                  onChange={() => toggleSelected(job.id)}
                  onClick={e => e.stopPropagation()}
                  disabled={job.status === 'added'}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#046C4E]"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-bold rounded-md px-2 py-0.5 ${scoreBadgeClass(job.match_score)}`}
                    title={job.match_score !== null ? '제목·위치만으로 추정한 예상 점수예요. 지원 현황에 추가하면 JD를 분석해 정밀 점수를 계산합니다.' : undefined}
                  >
                    {job.match_score !== null ? `예상 ${job.match_score}점` : '미채점'}
                  </span>
                  {job.match_score === null && !editMode && (
                    <button
                      onClick={() => handleRescore(job.id)}
                      disabled={scoringId !== null}
                      className="text-[11px] font-medium text-[#046C4E] border border-[#CEEBDC] rounded-md px-2 py-0.5 hover:bg-[#ECFDF3] disabled:opacity-40 transition-colors"
                    >
                      {scoringId === job.id ? '채점 중…' : '점수 매기기'}
                    </button>
                  )}
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
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

              <div className={`flex items-center gap-2 shrink-0 ${editMode ? 'hidden' : ''}`}>
                {job.status === 'added' ? (
                  <span className="flex items-center gap-2 whitespace-nowrap text-xs">
                    <span className="text-green-600">✓ 추가됨</span>
                    <a
                      href={
                        addedJobIds[job.id]
                          ? `/workspace?jobId=${encodeURIComponent(addedJobIds[job.id])}`
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
                      {addingId === job.id ? addingStep : '+ 지원 현황에 추가'}
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
