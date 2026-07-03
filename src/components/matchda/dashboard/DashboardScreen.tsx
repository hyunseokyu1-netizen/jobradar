import Sidebar from './Sidebar'
import Topbar from './Topbar'
import StatCards from './StatCards'
import KanbanBoard from './KanbanBoard'
import ApplicationsView from './ApplicationsView'
import AddJobForm from '@/components/AddJobForm'
import RunMatchButton from '@/components/RunMatchButton'
import JobList, { type JobItem } from '@/components/JobList'
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
  needsOnboarding = false,
  listJobs,
}: {
  t: Dictionary
  summary: DashboardSummary
  deltas?: string[]
  columns: KanbanColumn[]
  real: boolean
  unmatchedCount: number
  userEmail?: string | null
  needsOnboarding?: boolean
  /** 리스트 뷰용 공고 데이터 (실데이터에서만 제공) */
  listJobs?: JobItem[]
}) {
  const today = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'full' }).format(new Date())

  return (
    <div className="flex min-h-screen bg-[#F7F8FA] text-[#111827]">
      <Sidebar t={t} userName={summary.userName} userEmail={userEmail} />

      <main className="min-w-0 flex-1">
        <Topbar t={t} userName={summary.userName} userEmail={userEmail} />

        <div className="px-4 pb-16 pt-[30px] sm:px-6 lg:px-9">
          {/* 온보딩 미완료 유저 → 프로필 완성 유도 (매칭·맞춤 이력서의 전제 조건) */}
          {needsOnboarding && (
            <a
              href="/onboarding"
              className="mb-6 flex items-center justify-between gap-3 rounded-[14px] border border-[#CEEBDC] bg-[#ECFDF3] px-5 py-4 transition-colors hover:bg-[#DFF7E9]"
            >
              <div>
                <div className="text-[14px] font-bold text-[#046C4E]">
                  ✨ 프로필을 완성하고 나에게 꼭 맞는 채용 매칭을 받아보세요
                </div>
                <p className="mt-0.5 text-[13px] text-[#3D7A63]">
                  채팅으로 답하면 영어 이력서까지 자동으로 정리해 드려요. 3분이면 충분합니다.
                </p>
              </div>
              <span className="whitespace-nowrap rounded-[9px] bg-[#046C4E] px-4 py-2 text-[13px] font-semibold text-white">
                완성하기 →
              </span>
            </a>
          )}

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

          <ApplicationsView
            boardLabel={t.dashboard.viewBoard}
            listLabel={t.dashboard.viewList}
            header={
              <div>
                <h2 className="m-0 text-[18px] font-bold tracking-[-0.01em] text-[#101828]">
                  {t.dashboard.boardTitle}
                </h2>
                <p className="mt-1 text-[13px] text-[#98A2B3]">{t.dashboard.boardSub}</p>
              </div>
            }
            actions={real ? <RunMatchButton unmatchedCount={unmatchedCount} /> : undefined}
            board={<KanbanBoard columns={columns} t={t} interactive={real} />}
            list={
              real && listJobs ? (
                <div className="rounded-[14px] border border-[#ECEEF0] bg-white p-4 sm:p-5">
                  <JobList initialJobs={listJobs} />
                </div>
              ) : undefined
            }
          />
        </div>
      </main>
    </div>
  )
}
