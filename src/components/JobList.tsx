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
import StatusButton from './StatusButton'
import CoverLetterModal from './CoverLetterModal'
import JdInputModal from './JdInputModal'
import { deleteJob, matchSingleJob, updateJobMemo } from '@/app/actions'
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
        className="text-xs text-zinc-400 hover:text-blue-500 hover:underline disabled:opacity-50 transition-colors"
      >
        {matching ? '매칭 중...' : '미매칭'}
      </button>
    )
  }
  const color = score >= 70 ? 'bg-green-100 text-green-700 hover:bg-green-200' : score >= 50 ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
  return (
    <button
      onClick={handleMatch}
      disabled={matching}
      title="클릭해서 재매칭"
      className={`text-xs font-bold px-2 py-0.5 rounded-full transition-colors disabled:opacity-50 ${matching ? 'bg-zinc-100 text-zinc-400' : color}`}
    >
      {matching ? '매칭 중...' : `${score}점`}
    </button>
  )
}

function SortableJobCard({ job, onDelete, onUpdate }: { job: JobItem; onDelete: (id: string) => void; onUpdate: (id: string, patch: Partial<JobItem>) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: job.id })
  const [deleting, setDeleting] = useState(false)
  const [showCoverLetter, setShowCoverLetter] = useState(false)
  const [showJdInput, setShowJdInput] = useState(false)
  const [showMemo, setShowMemo] = useState(false)
  const [memo, setMemo] = useState(job.memo ?? '')
  const [savingMemo, setSavingMemo] = useState(false)

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

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-xl p-5 transition-colors ${
        job.match_score !== null ? 'border-zinc-300' : 'border-zinc-200'
      } ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* 드래그 핸들 */}
        <button
          {...attributes}
          {...listeners}
          className="mt-1 shrink-0 text-zinc-300 hover:text-zinc-500 cursor-grab active:cursor-grabbing"
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
              <StatusButton jobId={job.id} initialStatus={job.match_status} />
            )}
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
            {job.location && !job.location.startsWith('(Location') && <> · {job.location}</>}
            {job.salary && <> · <span className="text-green-600">{job.salary}</span></>}
          </p>
          {job.match_reason && (
            <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2">{job.match_reason}</p>
          )}
          {job.title === '스크래핑 실패' && job.description && (
            <p className="text-xs text-red-400 mt-1.5 line-clamp-1">오류: {job.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(job.source === 'glassdoor' || !job.description || job.description.length < 200) && (
            <button
              onClick={() => setShowJdInput(true)}
              className="text-xs border border-orange-200 text-orange-600 rounded-lg px-3 py-1.5 hover:bg-orange-50 transition-colors"
            >
              JD 입력
            </button>
          )}
          <button
            onClick={() => setShowMemo(prev => !prev)}
            className={`text-xs border rounded-lg px-3 py-1.5 transition-colors ${memo ? 'border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100' : 'border-zinc-200 hover:bg-zinc-50'}`}
          >
            {memo ? '📝 메모' : '메모'}
          </button>
          <button
            onClick={() => setShowCoverLetter(true)}
            className="text-xs border border-zinc-200 rounded-lg px-3 py-1.5 hover:bg-zinc-50 transition-colors"
          >
            커버레터
          </button>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs border border-zinc-200 rounded-lg px-3 py-1.5 hover:bg-zinc-50"
          >
            보기 →
          </a>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-zinc-300 hover:text-red-400 transition-colors px-1"
            aria-label="삭제"
          >
            ✕
          </button>
        </div>
      </div>

      {showMemo && (
        <div className="mt-3 ml-8 space-y-2">
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="메모를 입력하세요..."
            className="w-full text-sm border border-zinc-200 rounded-lg p-3 outline-none focus:border-zinc-400 resize-none text-zinc-700 placeholder:text-zinc-300"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setMemo(job.memo ?? ''); setShowMemo(false) }}
              className="text-xs text-zinc-400 hover:text-zinc-600 px-3 py-1.5"
            >
              취소
            </button>
            <button
              onClick={handleSaveMemo}
              disabled={savingMemo}
              className="text-xs bg-zinc-900 text-white px-3 py-1.5 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
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
    </li>
  )
}

export default function JobList({ initialJobs }: { initialJobs: JobItem[] }) {
  const [jobs, setJobs] = useState(initialJobs)

  // 서버 재렌더링 시 최신 데이터 동기화
  useEffect(() => { setJobs(initialJobs) }, [initialJobs])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setJobs(prev => {
        const oldIndex = prev.findIndex(j => j.id === active.id)
        const newIndex = prev.findIndex(j => j.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  function handleDelete(id: string) {
    setJobs(prev => prev.filter(j => j.id !== id))
  }

  function handleUpdate(id: string, patch: Partial<JobItem>) {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...patch } : j))
  }

  if (!jobs.length) return <p className="text-zinc-400 text-center py-20">아직 공고가 없습니다.</p>

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-3">
          {jobs.map(job => (
            <SortableJobCard key={job.id} job={job} onDelete={handleDelete} onUpdate={handleUpdate} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
