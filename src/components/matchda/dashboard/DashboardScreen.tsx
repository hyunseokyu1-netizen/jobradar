import Sidebar from './Sidebar'
import Topbar from './Topbar'
import StatCards from './StatCards'
import KanbanBoard from './KanbanBoard'
import AddJobForm from '@/components/AddJobForm'
import RunMatchButton from '@/components/RunMatchButton'
import type { Dictionary } from '@/lib/matchda/i18n'
import type { DashboardSummary, KanbanColumn } from '@/lib/matchda/types'

/**
 * MatchDa 대시보드 화면 (사이드바 + 상단바 + 통계 + 칸반).
 * /matchda/dashboard(공개 데모)와 로그인 홈(/) 양쪽에서 재사용한다.
 * real=true 면 인터랙티브 카드 + 공고 추가/일괄 매칭 진입점 노출.
 */
export default function DashboardScreen({
  t,
  summary,
  deltas,
  columns,
  real,
  unmatchedCount,
  userEmail,
}: {
  t: Dictionary
  summary: DashboardSummary
  deltas?: string[]
  columns: KanbanColumn[]
  real: boolean
  unmatchedCount: number
  userEmail?: string | null
}) {
  const today = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'full' }).format(new Date())

  return (
    <div className="flex min-h-screen bg-[#F7F8FA] text-[#111827]">
      <Sidebar t={t} userName={summary.userName} userEmail={userEmail} />

      <main className="min-w-0 flex-1">
        <Topbar t={t} />

        <div className="px-4 pb-16 pt-[30px] sm:px-6 lg:px-9">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="m-0 text-[22px] font-bold tracking-[-0.02em] text-[#101828] sm:text-[26px]">
                {t.dashboard.greeting(summary.userName)}
              </h1>
              <p className="mt-[7px] text-[15px] text-[#667085]">{t.dashboard.greetingSub}</p>
            </div>
            <div className="text-[13px] text-[#98A2B3]">{today}</div>
          </div>

          <StatCards t={t} values={summary.stats} deltas={deltas} />

          {/* 공고 추가 (URL/직접) — 로그인 실데이터에서만 */}
          {real && (
            <div className="mb-6 rounded-[14px] border border-[#ECEEF0] bg-white p-4">
              <AddJobForm />
            </div>
          )}

          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-[18px] font-bold tracking-[-0.01em] text-[#101828]">
                {t.dashboard.boardTitle}
              </h2>
              <p className="mt-1 text-[13px] text-[#98A2B3]">{t.dashboard.boardSub}</p>
            </div>
            <div className="flex items-center gap-3">
              {real && <RunMatchButton unmatchedCount={unmatchedCount} />}
              <div className="flex rounded-[9px] bg-[#EEF1F3] p-[3px]">
                <span className="cursor-pointer rounded-[7px] bg-white px-[14px] py-[6px] text-[13px] font-semibold text-[#1F2A37] shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
                  {t.dashboard.viewBoard}
                </span>
                <span className="cursor-pointer px-[14px] py-[6px] text-[13px] font-medium text-[#667085]">
                  {t.dashboard.viewList}
                </span>
              </div>
            </div>
          </div>

          <KanbanBoard columns={columns} t={t} interactive={real} />
        </div>
      </main>
    </div>
  )
}
