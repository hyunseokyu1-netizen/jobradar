import JobCard from './JobCard'
import type { KanbanColumn, ApplicationStatus } from '@/lib/matchda/types'
import type { Dictionary } from '@/lib/matchda/i18n'

/** 칸반 보드 (준비 중 / 지원 완료 / 면접 진행 / 오퍼) */
export default function KanbanBoard({
  columns,
  t,
}: {
  columns: KanbanColumn[]
  t: Dictionary
}) {
  return (
    <div className="grid grid-cols-1 items-start gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
      {columns.map((col) => (
        <div
          key={col.status}
          className="rounded-[14px] border border-[#EDF0F2] bg-[#F4F6F8] p-3"
        >
          <div className="flex items-center gap-2 px-[6px] pb-3 pt-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: col.dotColor }}
            />
            <span className="text-[13px] font-semibold text-[#344054]">
              {t.dashboard.columns[col.status as ApplicationStatus]}
            </span>
            <span className="rounded-[20px] bg-[#E7EBEE] px-2 py-[1px] text-[12px] font-semibold text-[#98A2B3]">
              {col.jobs.length}
            </span>
          </div>
          <div className="flex flex-col gap-[10px]">
            {col.jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                t={t}
                emphasized={col.status === 'offer'}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
