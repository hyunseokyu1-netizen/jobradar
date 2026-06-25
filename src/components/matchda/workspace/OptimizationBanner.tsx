import { Target } from '../ui/icons'
import type { ResumeWorkspaceData } from '@/lib/matchda/types'
import type { Dictionary } from '@/lib/matchda/i18n'

/** 그린 틴트 최적화 배너 */
export default function OptimizationBanner({
  t,
  data,
}: {
  t: Dictionary
  data: ResumeWorkspaceData
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#CEEBDC] bg-[#ECFDF3] px-7 py-3">
      <div className="flex items-center gap-[10px] text-[13px] font-medium text-[#046C4E]">
        <Target size={17} strokeWidth={1.8} />
        <span>
          {t.workspace.bannerPrefix}
          <b className="font-bold">
            {data.target.company} {data.target.role}
          </b>
          {t.workspace.bannerSuffix}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-medium text-[#046C4E]">{t.workspace.matchRateLabel}</span>
        <span className="rounded-[7px] bg-[#046C4E] px-[11px] py-[3px] text-[14px] font-bold text-white">
          {data.matchRate}%
        </span>
      </div>
    </div>
  )
}
