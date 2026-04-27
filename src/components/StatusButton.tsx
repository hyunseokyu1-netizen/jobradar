'use client'

import { useState } from 'react'
import { updateMatchStatus } from '@/app/actions'

type Status = 'new' | 'interested' | 'considering' | 'applied' | 'pass'

const STATUS_OPTIONS: { value: Status; label: string; className: string }[] = [
  { value: 'new',        label: '미분류',      className: 'text-zinc-400 border-zinc-200 hover:border-zinc-400' },
  { value: 'interested', label: '⭐ 관심있음', className: 'text-yellow-600 border-yellow-300 hover:border-yellow-500' },
  { value: 'considering',label: '🤔 고민중',   className: 'text-blue-600 border-blue-300 hover:border-blue-500' },
  { value: 'applied',    label: '✓ 지원완료',  className: 'text-green-600 border-green-300 hover:border-green-500' },
  { value: 'pass',       label: '✕ 패스',      className: 'text-zinc-300 border-zinc-200 hover:border-zinc-300' },
]

export default function StatusButton({ jobId, initialStatus }: { jobId: string; initialStatus: string }) {
  const [status, setStatus] = useState<Status>((initialStatus as Status) ?? 'new')
  const [loading, setLoading] = useState(false)

  const currentIdx = STATUS_OPTIONS.findIndex(o => o.value === status)
  const current = STATUS_OPTIONS[currentIdx] ?? STATUS_OPTIONS[0]
  const next = STATUS_OPTIONS[(currentIdx + 1) % STATUS_OPTIONS.length]

  async function handleClick() {
    setLoading(true)
    const res = await updateMatchStatus(jobId, next.value)
    if (!res.error) setStatus(next.value)
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={`클릭하면 "${next.label}"로 변경`}
      className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 ${current.className}`}
    >
      {current.label}
    </button>
  )
}
