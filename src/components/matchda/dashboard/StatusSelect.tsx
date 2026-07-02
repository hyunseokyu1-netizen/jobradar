'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateMatchStatus } from '@/app/actions'
import { STATUS_OPTIONS, type Status } from '@/components/StatusButton'
import { ChevronDown } from '../ui/icons'

/**
 * MatchDa 칸반 카드용 상태 드롭다운.
 * 옛 StatusButton의 8단계 상태(updateMatchStatus)를 그대로 이식하되 MatchDa 톤으로.
 */
export default function StatusSelect({
  jobId,
  initialStatus,
}: {
  jobId: string
  initialStatus: string
}) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>((initialStatus as Status) ?? 'new')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0]

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function select(next: Status, e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    setOpen(false)
    if (next === status) return
    setLoading(true)
    const res = await updateMatchStatus(jobId, next)
    if (!res.error) {
      setStatus(next)
      router.refresh() // 상태 변경 시 컬럼 재배치 반영
    }
    setLoading(false)
  }

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          setOpen((v) => !v)
        }}
        disabled={loading}
        className={`flex items-center gap-1 rounded-full border px-2 py-[2px] text-[11px] font-medium transition-colors disabled:opacity-50 ${current.pill}`}
      >
        {loading ? '...' : current.label}
        <ChevronDown size={11} className="opacity-60" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-[124px] overflow-hidden rounded-[10px] border border-[#ECEEF0] bg-white py-1 shadow-[0_8px_24px_rgba(16,24,40,0.12)]">
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={(e) => select(o.value, e)}
              className={`block w-full px-3 py-[6px] text-left text-[12px] ${o.menu} ${
                o.value === status ? 'font-semibold' : ''
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
