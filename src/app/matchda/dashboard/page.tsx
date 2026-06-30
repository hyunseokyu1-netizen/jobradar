import { getMatchdaDict } from '@/lib/matchda/i18n'
import { getDashboardSummary, getKanbanColumns } from '@/lib/matchda/mock-data'
import { getMatchdaDashboard } from '@/lib/matchda/data'
import Sidebar from '@/components/matchda/dashboard/Sidebar'
import Topbar from '@/components/matchda/dashboard/Topbar'
import StatCards from '@/components/matchda/dashboard/StatCards'
import KanbanBoard from '@/components/matchda/dashboard/KanbanBoard'

export const dynamic = 'force-dynamic'

export default async function MatchdaDashboardPage() {
  const t = getMatchdaDict('ko')

  // 로그인 시 실데이터, 비로그인 시 목업 데모로 폴백
  const real = await getMatchdaDashboard()
  const summary = real?.summary ?? getDashboardSummary()
  const columns = real?.columns ?? getKanbanColumns()
  const deltas = real?.deltas // undefined 면 StatCards 가 i18n 기본 델타 사용

  const today = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'full' }).format(new Date())

  return (
    <div className="flex min-h-screen bg-[#F7F8FA] text-[#111827]">
      <Sidebar t={t} />

      <main className="min-w-0 flex-1">
        <Topbar t={t} />

        <div className="px-9 pb-16 pt-[30px]">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h1 className="m-0 text-[26px] font-bold tracking-[-0.02em] text-[#101828]">
                {t.dashboard.greeting(summary.userName)}
              </h1>
              <p className="mt-[7px] text-[15px] text-[#667085]">{t.dashboard.greetingSub}</p>
            </div>
            <div className="text-[13px] text-[#98A2B3]">{today}</div>
          </div>

          <StatCards t={t} values={summary.stats} deltas={deltas} />

          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="m-0 text-[18px] font-bold tracking-[-0.01em] text-[#101828]">
                {t.dashboard.boardTitle}
              </h2>
              <p className="mt-1 text-[13px] text-[#98A2B3]">{t.dashboard.boardSub}</p>
            </div>
            {/* TODO: 보드/리스트 뷰 전환 — 현재 보드 고정 */}
            <div className="flex rounded-[9px] bg-[#EEF1F3] p-[3px]">
              <span className="cursor-pointer rounded-[7px] bg-white px-[14px] py-[6px] text-[13px] font-semibold text-[#1F2A37] shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
                {t.dashboard.viewBoard}
              </span>
              <span className="cursor-pointer px-[14px] py-[6px] text-[13px] font-medium text-[#667085]">
                {t.dashboard.viewList}
              </span>
            </div>
          </div>

          <KanbanBoard columns={columns} t={t} />
        </div>
      </main>
    </div>
  )
}
