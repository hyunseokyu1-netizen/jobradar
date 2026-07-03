import Link from 'next/link'
import { MapPin, Clock, Check } from '../ui/icons'
import { MonogramChip, MatchBadge } from '../ui/primitives'
import type { JobCardData } from '@/lib/matchda/types'
import type { Dictionary } from '@/lib/matchda/i18n'

/** 칸반 공고 카드. 클릭 시 워크스페이스로 이동 (README 네비게이션 흐름) */
export default function JobCard({
  job,
  t,
  emphasized = false,
}: {
  job: JobCardData
  t: Dictionary
  /** 오퍼 컬럼처럼 그린 테두리 강조 */
  emphasized?: boolean
}) {
  return (
    <Link
      href={`/workspace?jobId=${encodeURIComponent(job.id)}`}
      className={`block cursor-pointer rounded-[12px] border bg-white p-[14px] ${
        emphasized
          ? 'border-[#CEEBDC] shadow-[0_1px_2px_rgba(4,108,78,0.06)]'
          : 'border-[#E7EBEE] shadow-[0_1px_2px_rgba(16,24,40,0.04)]'
      }`}
    >
      <div className="mb-[11px] flex items-center gap-[10px]">
        <MonogramChip brand={job.brand} />
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-[#1F2A37]">{job.role}</div>
          <div className="text-[12px] text-[#98A2B3]">{job.company}</div>
        </div>
      </div>

      <div className="mb-[10px] flex items-center gap-[5px] text-[12px] text-[#667085]">
        <MapPin size={13} className="text-[#98A2B3]" />
        {job.location}
      </div>

      {job.statusBadge && (
        <div
          className={`mb-[10px] flex items-center gap-[6px] rounded-[7px] px-[9px] py-[6px] text-[12px] ${
            job.statusBadge.tone === 'amber'
              ? 'bg-[#FEF3E2] text-[#B45309]'
              : 'bg-[#ECFDF3] font-semibold text-[#046C4E]'
          }`}
        >
          {job.statusBadge.tone === 'amber' ? (
            <Clock size={13} />
          ) : (
            <Check size={13} />
          )}
          {job.statusBadge.text}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-[#F0F2F4] pt-[10px]">
        <span className="text-[13px] font-semibold text-[#1F2A37]">{job.salary}</span>
        <MatchBadge label={t.dashboard.matchLabel(job.matchRate)} />
      </div>
    </Link>
  )
}
