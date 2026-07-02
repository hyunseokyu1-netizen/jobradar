'use client'

import { useRouter } from 'next/navigation'
import { MapPin } from '../ui/icons'
import { MonogramChip, MatchBadge } from '../ui/primitives'
import StatusSelect from './StatusSelect'
import type { JobCardData } from '@/lib/matchda/types'

/**
 * 인터랙티브 칸반 카드(로그인 실데이터).
 * 카드 본문 클릭 → 워크스페이스, 우상단 상태 드롭다운 → updateMatchStatus.
 */
export default function InteractiveJobCard({
  job,
  matchLabel,
  emphasized = false,
}: {
  job: JobCardData
  matchLabel: string
  emphasized?: boolean
}) {
  const router = useRouter()

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/matchda/workspace?jobId=${encodeURIComponent(job.id)}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') router.push(`/matchda/workspace?jobId=${encodeURIComponent(job.id)}`)
      }}
      className={`block cursor-pointer rounded-[12px] border bg-white p-[14px] ${
        emphasized
          ? 'border-[#CEEBDC] shadow-[0_1px_2px_rgba(4,108,78,0.06)]'
          : 'border-[#E7EBEE] shadow-[0_1px_2px_rgba(16,24,40,0.04)]'
      }`}
    >
      <div className="mb-[11px] flex items-start gap-[10px]">
        <MonogramChip brand={job.brand} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold text-[#1F2A37]">{job.role}</div>
          <div className="text-[12px] text-[#98A2B3]">{job.company}</div>
        </div>
        {job.status && <StatusSelect jobId={job.id} initialStatus={job.status} />}
      </div>

      <div className="mb-[10px] flex items-center gap-[5px] text-[12px] text-[#667085]">
        <MapPin size={13} className="text-[#98A2B3]" />
        {job.location}
      </div>

      <div className="flex items-center justify-between border-t border-[#F0F2F4] pt-[10px]">
        <span className="text-[13px] font-semibold text-[#1F2A37]">{job.salary}</span>
        <MatchBadge label={matchLabel} />
      </div>
    </div>
  )
}
