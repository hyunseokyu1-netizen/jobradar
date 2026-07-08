import { Target } from '../ui/icons'
import RematchScoreBadge from './RematchScoreBadge'
import type { ResumeWorkspaceData } from '@/lib/matchda/types'
import type { Dictionary } from '@/lib/matchda/i18n'

/** 그린 틴트 최적화 배너. jobId가 있으면(실데이터) 매칭률 배지를 클릭해 재측정할 수 있다. */
export default function OptimizationBanner({
  t,
  data,
  jobId,
}: {
  t: Dictionary
  data: ResumeWorkspaceData
  jobId?: string
}) {
  // 맞춤 최적화본(목업)은 "최적화됨" 문구, 일반 이력서(실데이터)는 "공고와 비교" 문구
  const tailored = data.tailored !== false
  const prefix = tailored ? t.workspace.bannerPrefix : t.workspace.comparePrefix
  const suffix = tailored ? t.workspace.bannerSuffix : t.workspace.compareSuffix
  return (
    <div className="flex flex-col items-start justify-between gap-2 border-b border-[#CEEBDC] bg-[#ECFDF3] px-4 py-3 sm:flex-row sm:items-center sm:px-7">
      <div className="flex items-center gap-[10px] text-[13px] font-medium text-[#046C4E]">
        <Target size={17} strokeWidth={1.8} />
        <span>
          {prefix}
          <b className="font-bold">
            {data.target.company} {data.target.role}
          </b>
          {suffix}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-medium text-[#046C4E]">{t.workspace.matchRateLabel}</span>
        {jobId ? (
          <RematchScoreBadge jobId={jobId} matchRate={data.matchRate} />
        ) : (
          <span className="rounded-[7px] bg-[#046C4E] px-[11px] py-[3px] text-[14px] font-bold text-white">
            {data.matchRate}%
          </span>
        )}
      </div>
    </div>
  )
}
