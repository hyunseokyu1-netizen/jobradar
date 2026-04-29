'use client'

import { useState, useRef, useEffect } from 'react'
import { updateMatchStatus } from '@/app/actions'

type Status = 'new' | 'interested' | 'considering' | 'applied' | 'interview' | 'accepted' | 'rejected' | 'pass'

const STATUS_OPTIONS: { value: Status; label: string; pill: string; menu: string }[] = [
  { value: 'new',        label: '미분류',       pill: 'text-zinc-400 border-zinc-200',                         menu: 'text-zinc-600 hover:bg-zinc-50' },
  { value: 'interested', label: '⭐ 관심있음',  pill: 'text-yellow-600 border-yellow-300 bg-yellow-50',        menu: 'text-yellow-700 hover:bg-yellow-50' },
  { value: 'considering',label: '🤔 고민중',    pill: 'text-blue-600 border-blue-300 bg-blue-50',              menu: 'text-blue-700 hover:bg-blue-50' },
  { value: 'applied',    label: '✓ 지원완료',   pill: 'text-green-600 border-green-300 bg-green-50',           menu: 'text-green-700 hover:bg-green-50' },
  { value: 'interview',  label: '📅 면접',      pill: 'text-purple-600 border-purple-300 bg-purple-50',        menu: 'text-purple-700 hover:bg-purple-50' },
  { value: 'accepted',   label: '🎉 합격',      pill: 'text-emerald-700 border-emerald-400 bg-emerald-50',     menu: 'text-emerald-700 hover:bg-emerald-50' },
  { value: 'rejected',   label: '✕ 불합격',     pill: 'text-red-500 border-red-300 bg-red-50',                 menu: 'text-red-600 hover:bg-red-50' },
  { value: 'pass',       label: '— 패스',        pill: 'text-zinc-300 border-zinc-200',                         menu: 'text-zinc-400 hover:bg-zinc-50' },
]

export default function StatusButton({ jobId, initialStatus }: { jobId: string; initialStatus: string }) {
  const [status, setStatus] = useState<Status>((initialStatus as Status) ?? 'new')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = STATUS_OPTIONS.find(o => o.value === status) ?? STATUS_OPTIONS[0]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSelect(next: Status) {
    if (next === status) { setOpen(false); return }
    setLoading(true)
    setOpen(false)
    const res = await updateMatchStatus(jobId, next)
    if (!res.error) setStatus(next)
    setLoading(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        disabled={loading}
        className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 ${current.pill}`}
      >
        {loading ? '...' : current.label}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-zinc-200 rounded-xl shadow-lg py-1 min-w-[120px]">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left text-xs px-3 py-1.5 transition-colors ${opt.menu} ${opt.value === status ? 'font-semibold' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
