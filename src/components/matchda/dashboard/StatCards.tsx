import { FileShort, Bookmark, Briefcase, Target } from '../ui/icons'
import type { Dictionary } from '@/lib/matchda/i18n'

const ICONS = [FileShort, Bookmark, Briefcase, Target]
const DELTA_COLOR: Record<'green' | 'amber' | 'muted', string> = {
  green: '#046C4E',
  amber: '#B45309',
  muted: '#667085',
}

/**
 * 요약 stat 4카드.
 * deltas 가 주어지면(실데이터) 그 값을, 없으면 i18n 기본 델타(목업)를 쓴다.
 */
export default function StatCards({
  t,
  values,
  deltas,
}: {
  t: Dictionary
  values: string[]
  deltas?: string[]
}) {
  return (
    <div className="mb-7 grid grid-cols-2 gap-4 xl:grid-cols-4">
      {t.dashboard.statCards.map((card, i) => {
        const Icon = ICONS[i]
        const delta = deltas ? deltas[i] : card.delta
        return (
          <div key={card.label} className="rounded-[14px] border border-[#ECEEF0] bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-[#667085]">{card.label}</span>
              <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#ECFDF3] text-[#046C4E]">
                <Icon size={16} />
              </div>
            </div>
            <div className="my-[10px] mb-1 text-[30px] font-bold tracking-[-0.02em] text-[#101828]">
              {values[i]}
            </div>
            <div className="text-[12px] font-medium" style={{ color: DELTA_COLOR[card.tone] }}>
              {delta}
            </div>
          </div>
        )
      })}
    </div>
  )
}
