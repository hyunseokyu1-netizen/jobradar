'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext, PointerSensor, TouchSensor, useSensor, useSensors,
  useDraggable, useDroppable, closestCorners, type DragEndEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import InteractiveJobCard from './InteractiveJobCard'
import type { ApplicationStatus, JobCardData } from '@/lib/matchda/types'
import { updateMatchStatus } from '@/app/actions'

// 컬럼에 드롭했을 때 부여할 대표 matches.status
const COLUMN_TO_STATUS: Record<ApplicationStatus, string> = {
  preparing: 'new',
  applied: 'applied',
  interview: 'interview',
  offer: 'accepted',
}

export interface KanbanColumnView {
  status: ApplicationStatus
  title: string
  dotColor: string
  jobs: (JobCardData & { matchLabel: string })[]
}

/**
 * 드래그 가능한 칸반 보드 (로그인 실데이터 전용).
 * 카드를 다른 컬럼으로 드래그하면 지원 상태가 그 컬럼으로 변경된다.
 * (준비 중 → new, 지원 완료 → applied, 면접 진행 → interview, 오퍼 → accepted)
 */
export default function InteractiveKanban({ columns: initial }: { columns: KanbanColumnView[] }) {
  const router = useRouter()
  const [columns, setColumns] = useState(initial)
  // 서버가 새 props(initial)를 내려줄 때마다(router.refresh 등) 로컬 state를 동기화한다.
  // useState(initial)은 마운트 시 한 번만 반영되므로, 그 이후의 서버 리프레시(예: 공고
  // 직접 추가·삭제)가 이 컴포넌트에 반영되려면 렌더 중 동기화가 필요하다.
  const [prevInitial, setPrevInitial] = useState(initial)
  if (initial !== prevInitial) {
    setPrevInitial(initial)
    setColumns(initial)
  }
  // 드래그 직후 발생하는 click이 카드 클릭(워크스페이스 이동)으로 새지 않게 차단
  const dragHappened = useRef(false)

  // 마우스: 8px 이상 움직여야 드래그 시작 — 일반 클릭·상태 드롭다운 조작을 방해하지 않음
  // 터치: 200ms 길게 누른 뒤 드래그 시작 — 페이지 스크롤 제스처와 충돌하지 않음
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  async function handleDragEnd(e: DragEndEvent) {
    const jobId = String(e.active.id)
    const target = e.over?.id as ApplicationStatus | undefined
    if (!target) return

    const fromCol = columns.find(c => c.jobs.some(j => j.id === jobId))
    if (!fromCol || fromCol.status === target) return

    const job = fromCol.jobs.find(j => j.id === jobId)!
    const nextStatus = COLUMN_TO_STATUS[target]

    // 낙관적 이동 (실패 시 원복)
    const prev = columns
    setColumns(cols => cols.map(c =>
      c.status === fromCol.status ? { ...c, jobs: c.jobs.filter(j => j.id !== jobId) }
      : c.status === target ? { ...c, jobs: [...c.jobs, { ...job, status: nextStatus }] }
      : c
    ))

    const res = await updateMatchStatus(jobId, nextStatus)
    if (res.error) {
      setColumns(prev)
      alert(res.error)
      return
    }
    router.refresh()
  }

  return (
    <DndContext
      id="kanban-board"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={() => { dragHappened.current = true }}
      onDragEnd={(e) => { handleDragEnd(e); setTimeout(() => { dragHappened.current = false }, 0) }}
      onDragCancel={() => { setTimeout(() => { dragHappened.current = false }, 0) }}
    >
      <div
        className="grid grid-cols-1 items-start gap-[14px] sm:grid-cols-2 xl:grid-cols-4"
        onClickCapture={(e) => {
          if (dragHappened.current) { e.preventDefault(); e.stopPropagation() }
        }}
      >
        {columns.map((col) => (
          <DroppableColumn key={col.status} col={col} />
        ))}
      </div>
    </DndContext>
  )
}

function DroppableColumn({ col }: { col: KanbanColumnView }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.status })
  return (
    <div
      ref={setNodeRef}
      className={`rounded-[14px] border p-3 transition-colors ${
        isOver ? 'border-[#9ADBBE] bg-[#ECFDF3]' : 'border-[#EDF0F2] bg-[#F4F6F8]'
      }`}
    >
      <div className="flex items-center gap-2 px-[6px] pb-3 pt-1">
        <span className="h-2 w-2 rounded-full" style={{ background: col.dotColor }} />
        <span className="text-[13px] font-semibold text-[#344054]">{col.title}</span>
        <span className="rounded-[20px] bg-[#E7EBEE] px-2 py-[1px] text-[12px] font-semibold text-[#98A2B3]">
          {col.jobs.length}
        </span>
      </div>
      <div className="flex min-h-[40px] flex-col gap-[10px]">
        {col.jobs.map((job) => (
          <DraggableCard key={`${job.id}-${job.status}`} job={job} emphasized={col.status === 'offer'} />
        ))}
      </div>
    </div>
  )
}

function DraggableCard({ job, emphasized }: { job: KanbanColumnView['jobs'][number]; emphasized: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: job.id })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Translate.toString(transform) }}
      // touch-manipulation: 더블탭 줌 등 브라우저 제스처를 막아 길게 누르기 → 드래그가 안정적으로 시작되게 함 (스크롤은 유지)
      className={`touch-manipulation ${isDragging ? 'z-30 cursor-grabbing opacity-90 shadow-[0_10px_28px_rgba(16,24,40,0.16)]' : 'cursor-grab'}`}
    >
      <InteractiveJobCard job={job} matchLabel={job.matchLabel} emphasized={emphasized} />
    </div>
  )
}
