'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import StatusButton, { STATUS_OPTIONS } from './StatusButton'
import CoverLetterModal from './CoverLetterModal'
import JdInputModal from './JdInputModal'
import AppliedResumeModal from './AppliedResumeModal'
import TailoredResumeModal from './TailoredResumeModal'
import { deleteJob, matchSingleJob, updateJobMemo, updateAppliedAt, updateJobTitle, updateJobCompany, updateJobLocation, reorderJobs } from '@/app/actions'
import { PLATFORM_STYLE, type Platform } from '@/lib/detect-platform'

export interface JobItem {
  id: string
  source: string
  title: string
  company: string
  location: string
  salary: string | null
  url: string
  description: string | null | undefined
  posted_at: string | null
  scraped_at: string
  match_score: number | null
  match_reason: string | null
  match_status: string
  memo: string | null
  applied_resume_text: string | null
  applied_resume_filename: string | null
  applied_at: string | null
  position: number | null
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  const h = Math.floor(diff / 3600000)
  if (d > 0) return `${d}일 전`
  if (h > 0) return `${h}시간 전`
  return '방금'
}

function ScoreBadge({ score, jobId, onMatched }: { score: number | null; jobId: string; onMatched: (score: number) => void }) {
  const [matching, setMatching] = useState(false)

  async function handleMatch() {
    setMatching(true)
    const res = await matchSingleJob(jobId)
    if (res.score !== undefined) onMatched(res.score)
    setMatching(false)
  }

  if (score === null) {
    return (
      <button
        onClick={handleMatch}
        disabled={matching}
        className="text-xs text-[#98A2B3] hover:text-blue-500 hover:underline disabled:opacity-50 transition-colors"
      >
        {matching ? '매칭 중...' : '미매칭'}
      </button>
    )
  }
  const color = score >= 70 ? 'bg-green-100 text-green-700 hover:bg-green-200' : score >= 50 ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-[#F4F6F8] text-[#667085] hover:bg-[#ECEEF0]'
  return (
    <button
      onClick={handleMatch}
      disabled={matching}
      title="클릭해서 재매칭"
      className={`text-xs font-bold px-2 py-0.5 rounded-full transition-colors disabled:opacity-50 ${matching ? 'bg-[#F4F6F8] text-[#98A2B3]' : color}`}
    >
      {matching ? '매칭 중...' : `${score}점`}
    </button>
  )
}

function SortableJobCard({ job, draggable, onDelete, onUpdate }: { job: JobItem; draggable: boolean; onDelete: (id: string) => void; onUpdate: (id: string, patch: Partial<JobItem>) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: job.id, disabled: !draggable })
  const [deleting, setDeleting] = useState(false)
  const [showCoverLetter, setShowCoverLetter] = useState(false)
  const [showJdInput, setShowJdInput] = useState(false)
  const [showMemo, setShowMemo] = useState(false)
  const [memo, setMemo] = useState(job.memo ?? '')
  const [savingMemo, setSavingMemo] = useState(false)
  const [showResume, setShowResume] = useState(false)
  const [showTailoredResume, setShowTailoredResume] = useState(false)
  const [resumeFilename, setResumeFilename] = useState(job.applied_resume_filename ?? '')
  const [resumeText, setResumeText] = useState(job.applied_resume_text ?? '')
  const [appliedAt, setAppliedAt] = useState(job.applied_at ?? '')
  const [editingDate, setEditingDate] = useState(false)
  const [dateInput, setDateInput] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(job.title)
  const [savingTitle, setSavingTitle] = useState(false)
  const [editingCompany, setEditingCompany] = useState(false)
  const [companyInput, setCompanyInput] = useState(job.company)
  const [savingCompany, setSavingCompany] = useState(false)
  const [editingLocation, setEditingLocation] = useState(false)
  const [locationInput, setLocationInput] = useState(job.location)
  const [savingLocation, setSavingLocation] = useState(false)
  const [reasonExpanded, setReasonExpanded] = useState(false)

  // JD 입력이 필요한 카드(설명 부실) 여부 — 입력 완료된 카드는 음영 처리
  const needsJdInput = job.source === 'glassdoor' || !job.description || job.description.length < 200

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  async function handleDelete() {
    if (!confirm('이 공고를 삭제할까요?')) return
    setDeleting(true)
    await deleteJob(job.id)
    onDelete(job.id)
  }

  async function handleSaveMemo() {
    setSavingMemo(true)
    await updateJobMemo(job.id, memo)
    setSavingMemo(false)
    setShowMemo(false)
  }

  function startEditDate() {
    const d = appliedAt ? new Date(appliedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
    setDateInput(d)
    setEditingDate(true)
  }

  async function handleSaveDate() {
    const iso = dateInput ? new Date(dateInput).toISOString() : ''
    await updateAppliedAt(job.id, iso)
    setAppliedAt(iso)
    setEditingDate(false)
  }

  function daysElapsed(iso: string) {
    return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  }

  function startEditTitle() {
    setTitleInput(job.title)
    setEditingTitle(true)
  }

  async function handleSaveTitle() {
    const trimmed = titleInput.trim()
    if (!trimmed || trimmed === job.title) { setEditingTitle(false); return }
    setSavingTitle(true)
    const res = await updateJobTitle(job.id, trimmed)
    setSavingTitle(false)
    if (!res.error) {
      onUpdate(job.id, { title: trimmed })
      setEditingTitle(false)
    }
  }

  function startEditCompany() {
    setCompanyInput(job.company)
    setEditingCompany(true)
  }

  async function handleSaveCompany() {
    const trimmed = companyInput.trim()
    if (trimmed === job.company) { setEditingCompany(false); return }
    setSavingCompany(true)
    const res = await updateJobCompany(job.id, trimmed)
    setSavingCompany(false)
    if (!res.error) {
      onUpdate(job.id, { company: trimmed })
      setEditingCompany(false)
    }
  }

  function startEditLocation() {
    setLocationInput(job.location)
    setEditingLocation(true)
  }

  async function handleSaveLocation() {
    const trimmed = locationInput.trim()
    if (trimmed === job.location) { setEditingLocation(false); return }
    setSavingLocation(true)
    const res = await updateJobLocation(job.id, trimmed)
    setSavingLocation(false)
    if (!res.error) {
      onUpdate(job.id, { location: trimmed })
      setEditingLocation(false)
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`border rounded-xl p-5 transition-colors ${
        needsJdInput ? 'bg-white' : 'bg-[#F4F6F8]/70'
      } ${
        job.match_score !== null ? 'border-[#E2E6EA]' : 'border-[#ECEEF0]'
      } ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* 드래그 핸들 — 직접 정렬 모드에서만 활성화 */}
        <button
          {...attributes}
          {...listeners}
          disabled={!draggable}
          title={draggable ? '드래그해서 순서 변경' : '‘직접 정렬’에서 순서를 바꿀 수 있어요'}
          className={`mt-1 shrink-0 ${
            draggable
              ? 'text-[#98A2B3] hover:text-[#475467] cursor-grab active:cursor-grabbing'
              : 'text-[#E4E7EB] cursor-not-allowed'
          }`}
          aria-label="드래그"
        >
          ⠿
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLATFORM_STYLE[job.source as Platform]?.className ?? PLATFORM_STYLE.other.className}`}>
              {PLATFORM_STYLE[job.source as Platform]?.label ?? job.source}
            </span>
            <ScoreBadge
              score={job.match_score}
              jobId={job.id}
              onMatched={score => onUpdate(job.id, { match_score: score, match_status: 'new' })}
            />
            {job.match_score !== null && (
              <StatusButton
                jobId={job.id}
                initialStatus={job.match_status}
                onAppliedAt={date => setAppliedAt(date)}
                onStatusChange={next => onUpdate(job.id, { match_status: next })}
              />
            )}
            {appliedAt && !editingDate && (
              <button
                onClick={startEditDate}
                className="text-xs text-[#98A2B3] hover:text-[#475467] transition-colors"
                title="지원 날짜 수정"
              >
                지원 후 {daysElapsed(appliedAt)}일
              </button>
            )}
            {!appliedAt && job.match_status === 'applied' && !editingDate && (
              <button
                onClick={startEditDate}
                className="text-xs text-[#D0D5DB] hover:text-[#667085] transition-colors"
              >
                날짜 입력
              </button>
            )}
            {editingDate && (
              <span className="flex items-center gap-1">
                <input
                  type="date"
                  value={dateInput}
                  onChange={e => setDateInput(e.target.value)}
                  className="text-xs border border-[#E2E6EA] rounded px-1.5 py-0.5 outline-none focus:border-[#046C4E]"
                  autoFocus
                />
                <button onClick={handleSaveDate} className="text-xs text-blue-500 hover:text-blue-700 px-1">저장</button>
                <button onClick={() => setEditingDate(false)} className="text-xs text-[#98A2B3] hover:text-[#475467] px-1">취소</button>
              </span>
            )}
            <span className="text-xs text-[#98A2B3]">
              {job.posted_at ? timeAgo(job.posted_at) : timeAgo(job.scraped_at)}
            </span>
          </div>

          {editingTitle ? (
            <div className="flex items-center gap-1.5">
              <input
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveTitle()
                  if (e.key === 'Escape') setEditingTitle(false)
                }}
                autoFocus
                className="flex-1 text-sm font-semibold border border-[#E2E6EA] rounded-lg px-2 py-1 outline-none focus:border-[#046C4E]"
              />
              <button onClick={handleSaveTitle} disabled={savingTitle} className="text-xs text-blue-500 hover:text-blue-700 px-1 disabled:opacity-50">
                {savingTitle ? '...' : '저장'}
              </button>
              <button onClick={() => setEditingTitle(false)} className="text-xs text-[#98A2B3] hover:text-[#475467] px-1">취소</button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group/title">
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#101828] hover:text-blue-600 leading-snug truncate"
              >
                {job.title}
              </a>
              <button
                onClick={startEditTitle}
                className="text-xs text-[#D0D5DB] hover:text-[#475467] transition-colors shrink-0 opacity-0 group-hover/title:opacity-100"
                title="제목 수정"
                aria-label="제목 수정"
              >
                ✏️
              </button>
            </div>
          )}
          {editingCompany ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <input
                value={companyInput}
                onChange={e => setCompanyInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveCompany()
                  if (e.key === 'Escape') setEditingCompany(false)
                }}
                autoFocus
                placeholder="회사명"
                className="flex-1 text-sm border border-[#E2E6EA] rounded-lg px-2 py-1 outline-none focus:border-[#046C4E]"
              />
              <button onClick={handleSaveCompany} disabled={savingCompany} className="text-xs text-blue-500 hover:text-blue-700 px-1 disabled:opacity-50">
                {savingCompany ? '...' : '저장'}
              </button>
              <button onClick={() => setEditingCompany(false)} className="text-xs text-[#98A2B3] hover:text-[#475467] px-1">취소</button>
            </div>
          ) : (
            <p className="text-sm text-[#667085] mt-0.5 flex items-center gap-1.5 group/company">
              <span>
                {job.company || <span className="text-[#D0D5DB]">회사명 없음</span>}
                {job.salary && <> · <span className="text-green-600">{job.salary}</span></>}
              </span>
              <button
                onClick={startEditCompany}
                className="text-xs text-[#D0D5DB] hover:text-[#475467] transition-colors shrink-0 opacity-0 group-hover/company:opacity-100"
                title="회사명 수정"
                aria-label="회사명 수정"
              >
                ✏️
              </button>
            </p>
          )}
          {editingLocation ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <input
                value={locationInput}
                onChange={e => setLocationInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveLocation()
                  if (e.key === 'Escape') setEditingLocation(false)
                }}
                autoFocus
                placeholder="위치 (예: Sydney, Australia)"
                className="flex-1 text-sm border border-[#E2E6EA] rounded-lg px-2 py-1 outline-none focus:border-[#046C4E]"
              />
              <button onClick={handleSaveLocation} disabled={savingLocation} className="text-xs text-blue-500 hover:text-blue-700 px-1 disabled:opacity-50">
                {savingLocation ? '...' : '저장'}
              </button>
              <button onClick={() => setEditingLocation(false)} className="text-xs text-[#98A2B3] hover:text-[#475467] px-1">취소</button>
            </div>
          ) : (
            <p className="text-sm text-[#667085] mt-0.5 flex items-center gap-1.5 group/location">
              {job.location && !job.location.startsWith('(Location') ? (
                <>
                  <span>📍 {job.location}</span>
                  <button
                    onClick={startEditLocation}
                    className="text-xs text-[#D0D5DB] hover:text-[#475467] transition-colors shrink-0 opacity-0 group-hover/location:opacity-100"
                    title="위치 수정"
                    aria-label="위치 수정"
                  >
                    ✏️
                  </button>
                </>
              ) : (
                <button
                  onClick={startEditLocation}
                  className="text-xs text-[#98A2B3] hover:text-[#344054] transition-colors"
                >
                  + 위치 추가
                </button>
              )}
            </p>
          )}
          {job.match_reason && (
            <p
              onClick={() => setReasonExpanded(p => !p)}
              title={reasonExpanded ? '접기' : '더보기'}
              className={`text-xs text-[#98A2B3] mt-1.5 cursor-pointer hover:text-[#667085] transition-colors ${reasonExpanded ? '' : 'line-clamp-2'}`}
            >
              {job.match_reason}
            </p>
          )}
          {job.title === '스크래핑 실패' && job.description && (
            <p className="text-xs text-red-400 mt-1.5 line-clamp-1">오류: {job.description}</p>
          )}

          {/* 액션 버튼 — 컨텐츠 아래 (모바일/데스크톱 공통) */}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            {needsJdInput && (
              <button
                onClick={() => setShowJdInput(true)}
                className="text-xs border border-orange-200 text-orange-600 rounded-lg px-3 py-1.5 hover:bg-orange-50 transition-colors"
              >
                JD 입력
              </button>
            )}
            <button
              onClick={() => setShowMemo(prev => !prev)}
              className={`text-xs border rounded-lg px-3 py-1.5 transition-colors ${memo ? 'border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100' : 'border-[#ECEEF0] hover:bg-[#F4F6F8]'}`}
            >
              {memo ? '📝 메모' : '메모'}
            </button>
            <button
              onClick={() => setShowCoverLetter(true)}
              className="text-xs border border-[#ECEEF0] rounded-lg px-3 py-1.5 hover:bg-[#F4F6F8] transition-colors"
            >
              커버레터
            </button>
            <button
              onClick={() => setShowTailoredResume(true)}
              className="text-xs border border-emerald-200 text-emerald-600 rounded-lg px-3 py-1.5 hover:bg-emerald-50 transition-colors"
            >
              ✦ 맞춤 이력서
            </button>
            <button
              onClick={() => setShowResume(true)}
              className={`text-xs border rounded-lg px-3 py-1.5 transition-colors ${resumeFilename ? 'border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'border-[#ECEEF0] hover:bg-[#F4F6F8]'}`}
            >
              {resumeFilename ? '📄 제출 서류' : '제출 서류'}
            </button>
          </div>
        </div>

        {/* 우측 — 워크스페이스, 보기, 삭제 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={`/workspace?jobId=${encodeURIComponent(job.id)}`}
            className="text-xs border border-[#CEEBDC] text-[#046C4E] rounded-lg px-3 py-1.5 hover:bg-[#ECFDF3] whitespace-nowrap"
          >
            워크스페이스
          </a>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs border border-[#ECEEF0] rounded-lg px-3 py-1.5 hover:bg-[#F4F6F8] whitespace-nowrap"
          >
            보기 →
          </a>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-[#D0D5DB] hover:text-red-400 transition-colors px-1.5 py-1.5"
            aria-label="삭제"
          >
            ✕
          </button>
        </div>
      </div>

      {showMemo && (
        <div className="mt-3 ml-7 space-y-2">
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="메모를 입력하세요..."
            className="w-full text-sm border border-[#ECEEF0] rounded-lg p-3 outline-none focus:border-[#046C4E] resize-none text-[#344054] placeholder:text-[#D0D5DB]"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setMemo(job.memo ?? ''); setShowMemo(false) }}
              className="text-xs text-[#98A2B3] hover:text-[#475467] px-3 py-1.5"
            >
              취소
            </button>
            <button
              onClick={handleSaveMemo}
              disabled={savingMemo}
              className="text-xs bg-[#046C4E] text-white px-3 py-1.5 rounded-lg hover:bg-[#035A40] disabled:opacity-50 transition-colors"
            >
              {savingMemo ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      )}

      {showJdInput && (
        <JdInputModal
          jobId={job.id}
          jobTitle={job.title}
          company={job.company}
          initialDescription={job.description}
          onClose={() => setShowJdInput(false)}
          onMatched={score => {
            onUpdate(job.id, { match_score: score, description: 'updated' })
            setShowJdInput(false)
          }}
        />
      )}

      {showCoverLetter && (
        <CoverLetterModal
          jobId={job.id}
          jobTitle={job.title}
          company={job.company}
          onClose={() => setShowCoverLetter(false)}
        />
      )}

      {showTailoredResume && (
        <TailoredResumeModal
          jobId={job.id}
          jobTitle={job.title}
          company={job.company}
          onClose={() => setShowTailoredResume(false)}
        />
      )}

      {showResume && (
        <AppliedResumeModal
          jobId={job.id}
          jobTitle={job.title}
          company={job.company}
          initialFilename={resumeFilename}
          initialText={resumeText}
          onClose={() => setShowResume(false)}
          onUploaded={(fname, text) => {
            setResumeFilename(fname)
            setResumeText(text)
          }}
        />
      )}
    </li>
  )
}

type SortMode = 'score' | 'recent' | 'manual'

export default function JobList({ initialJobs }: { initialJobs: JobItem[] }) {
  const [jobs, setJobs] = useState(initialJobs)
  const [filter, setFilter] = useState('all')
  const [sortMode, setSortMode] = useState<SortMode>('score')

  // 서버 재렌더링 시 최신 데이터 동기화
  useEffect(() => { setJobs(initialJobs) }, [initialJobs])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = jobs.findIndex(j => j.id === active.id)
    const newIndex = jobs.findIndex(j => j.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const next = arrayMove(jobs, oldIndex, newIndex)
    setJobs(next)
    setSortMode('manual')
    // 새 순서를 DB에 저장 (유저별 position)
    reorderJobs(next.map(j => j.id))
  }

  function handleDelete(id: string) {
    setJobs(prev => prev.filter(j => j.id !== id))
  }

  function handleUpdate(id: string, patch: Partial<JobItem>) {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...patch } : j))
  }

  if (!jobs.length) return <p className="text-[#98A2B3] text-center py-20">아직 공고가 없습니다.</p>

  const statusCounts = jobs.reduce<Record<string, number>>((acc, j) => {
    acc[j.match_status] = (acc[j.match_status] ?? 0) + 1
    return acc
  }, {})

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.match_status === filter)
  // 직접 정렬은 jobs 배열 순서 그대로, 최신순은 등록(scraped_at) 기준, 점수순은 매칭됨 우선 + 점수 내림차순
  const filteredJobs =
    sortMode === 'manual'
      ? filtered
      : sortMode === 'recent'
      ? [...filtered].sort((a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime())
      : [...filtered].sort((a, b) => {
          if (a.match_score !== null && b.match_score === null) return -1
          if (a.match_score === null && b.match_score !== null) return 1
          return (b.match_score ?? 0) - (a.match_score ?? 0)
        })

  return (
    <div>
      {/* 상태 필터 + 정렬 */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
            filter === 'all'
              ? 'bg-[#046C4E] text-white border-[#046C4E]'
              : 'text-[#667085] border-[#ECEEF0] hover:bg-[#F4F6F8]'
          }`}
        >
          전체 {jobs.length}
        </button>
        {STATUS_OPTIONS.filter(opt => (statusCounts[opt.value] ?? 0) > 0).map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(prev => prev === opt.value ? 'all' : opt.value)}
            className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
              filter === opt.value ? opt.pill + ' ring-1 ring-current' : 'text-[#667085] border-[#ECEEF0] hover:bg-[#F4F6F8]'
            }`}
          >
            {opt.label} {statusCounts[opt.value]}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1 text-xs">
          <span className="text-[#98A2B3]">정렬</span>
          <button
            onClick={() => setSortMode('score')}
            className={`px-2 py-1 rounded-full border transition-colors ${
              sortMode === 'score' ? 'bg-[#046C4E] text-white border-[#046C4E]' : 'text-[#667085] border-[#ECEEF0] hover:bg-[#F4F6F8]'
            }`}
          >
            점수순
          </button>
          <button
            onClick={() => setSortMode('recent')}
            className={`px-2 py-1 rounded-full border transition-colors ${
              sortMode === 'recent' ? 'bg-[#046C4E] text-white border-[#046C4E]' : 'text-[#667085] border-[#ECEEF0] hover:bg-[#F4F6F8]'
            }`}
          >
            최신순
          </button>
          <button
            onClick={() => setSortMode('manual')}
            title="드래그해서 원하는 순서로 정렬"
            className={`px-2 py-1 rounded-full border transition-colors ${
              sortMode === 'manual' ? 'bg-[#046C4E] text-white border-[#046C4E]' : 'text-[#667085] border-[#ECEEF0] hover:bg-[#F4F6F8]'
            }`}
          >
            직접 정렬
          </button>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <p className="text-[#98A2B3] text-center py-20">해당 상태의 공고가 없습니다.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredJobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-3">
              {filteredJobs.map(job => (
                <SortableJobCard key={job.id} job={job} draggable={sortMode === 'manual'} onDelete={handleDelete} onUpdate={handleUpdate} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
