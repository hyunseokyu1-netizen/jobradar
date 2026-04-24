'use client'

import { useState } from 'react'
import { updateMatchStatus } from '@/app/actions'

type Status = 'new' | 'bookmarked' | 'applied' | 'pass'

const STATUS_OPTIONS: { value: Status; label: string; className: string }[] = [
  { value: 'new',        label: '새 공고',  className: 'text-zinc-400 hover:text-zinc-600' },
  { value: 'bookmarked', label: '★ 저장',  className: 'text-yellow-500 hover:text-yellow-600' },
  { value: 'applied',    label: '✓ 지원',  className: 'text-blue-500 hover:text-blue-600' },
  { value: 'pass',       label: '✕ 패스',  className: 'text-zinc-300 hover:text-zinc-400' },
]

export default function StatusButton({ jobId, initialStatus }: { jobId: string; initialStatus: Status }) {
  const [status, setStatus] = useState<Status>(initialStatus)
  const [loading, setLoading] = useState(false)

  const current = STATUS_OPTIONS.find(o => o.value === status) ?? STATUS_OPTIONS[0]
  const next = STATUS_OPTIONS[(STATUS_OPTIONS.findIndex(o => o.value === status) + 1) % STATUS_OPTIONS.length]

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
      title={`${current.label} → 클릭하면 "${next.label}"로 변경`}
      className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 ${current.className} border-current`}
    >
      {current.label}
    </button>
  )
}
