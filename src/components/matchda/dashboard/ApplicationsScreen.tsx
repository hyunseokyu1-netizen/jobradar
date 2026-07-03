import Sidebar from './Sidebar'
import Topbar from './Topbar'
import KanbanBoard from './KanbanBoard'
import ApplicationsView from './ApplicationsView'
import AddJobForm from '@/components/AddJobForm'
import RunMatchButton from '@/components/RunMatchButton'
import JobList, { type JobItem } from '@/components/JobList'
import type { Dictionary } from '@/lib/matchda/i18n'
import type { KanbanColumn } from '@/lib/matchda/types'

/**
 * 지원 현황 화면 (사이드바 + 상단바 + 공고추가 + 칸반 보드/리스트 토글).
 * /applications(로그인 필요) 에서 렌더한다.
 */
export default function ApplicationsScreen({
  t,
  userName,
  columns,
  real,
  unmatchedCount,
  userEmail,
  listJobs,
}: {
  t: Dictionary
  userName: string
  columns: KanbanColumn[]
  real: boolean
  unmatchedCount: number
  userEmail?: string | null
  /** 리스트 뷰용 공고 데이터 (실데이터에서만 제공, 빈 배열이어도 리스트 뷰 활성화) */
  listJobs?: JobItem[]
}) {
  return (
    <div className="flex min-h-screen bg-[#F7F8FA] text-[#111827]">
      <Sidebar t={t} userName={userName} userEmail={userEmail} activeKey="applications" />

      <main className="min-w-0 flex-1">
        <Topbar t={t} userName={userName} userEmail={userEmail} />

        <div className="px-4 pb-16 pt-[30px] sm:px-6 lg:px-9">
          <div className="mb-6">
            <h1 className="m-0 text-[22px] font-bold tracking-[-0.02em] text-[#101828] sm:text-[26px]">
              {t.dashboard.boardTitle}
            </h1>
            <p className="mt-[7px] text-[15px] text-[#667085]">{t.dashboard.boardSub}</p>
          </div>

          {/* 공고 추가 (URL/직접) — 로그인 실데이터에서만 */}
          {real && (
            <div className="mb-6 rounded-[14px] border border-[#ECEEF0] bg-white p-4">
              <AddJobForm />
            </div>
          )}

          <ApplicationsView
            boardLabel={t.dashboard.viewBoard}
            listLabel={t.dashboard.viewList}
            header={null}
            actions={real ? <RunMatchButton unmatchedCount={unmatchedCount} /> : undefined}
            board={<KanbanBoard columns={columns} t={t} interactive={real} />}
            list={
              real ? (
                <div className="rounded-[14px] border border-[#ECEEF0] bg-white p-4 sm:p-5">
                  <JobList initialJobs={listJobs ?? []} />
                </div>
              ) : undefined
            }
          />
        </div>
      </main>
    </div>
  )
}
