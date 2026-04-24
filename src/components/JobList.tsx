'use client'

import { useState } from 'react'
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
import { deleteJob } from '@/app/actions'
import { PLATFORM_STYLE, type Platform } from '@/lib/detect-platform'

export interface JobItem {
  id: string
  source: string
  title: string
  company: string
  location: string
  salary: string | null
  url: string
  description: string | null
  posted_at: string | null
  scraped_at: string
  match_score: number | null
  match_reason: string | null
  match_status: 'new' | 'bookmarked' | 'applied' | 'pass'
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

function SortableJobCard({ job, onDelete }: { job: JobItem; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: job.id })
  const [deleting, setDeleting] = useState(false)

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
            <ScoreBadge score={job.match_score} />
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
    </li>
  )
}

export default function JobList({ initialJobs }: { initialJobs: JobItem[] }) {
  const [jobs, setJobs] = useState(initialJobs)

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

  if (!jobs.length) return <p className="text-zinc-400 text-center py-20">아직 공고가 없습니다.</p>

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-3">
          {jobs.map(job => (
            <SortableJobCard key={job.id} job={job} onDelete={handleDelete} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
