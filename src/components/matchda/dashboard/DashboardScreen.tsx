import Link from 'next/link'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import StatCards from './StatCards'
import { ArrowRight } from '../ui/icons'
import type { JobItem } from '@/components/JobList'
import type { Dictionary } from '@/lib/matchda/i18n'
import type { DashboardSummary } from '@/lib/matchda/types'

const STATUS_LABEL: Record<string, string> = {
  new: '준비 중',
  interested: '관심',
  considering: '검토 중',
  applied: '지원 완료',
  interview: '면접',
  accepted: '오퍼',
}

function matchTone(score: number | null): string {
  if (score === null) return 'bg-[#F4F6F8] text-[#98A2B3]'
  if (score >= 70) return 'bg-emerald-100 text-emerald-700'
  if (score >= 40) return 'bg-amber-100 text-amber-700'
  return 'bg-[#F4F6F8] text-[#667085]'
}

/**
 * MatchDa 대시보드 — 요약 화면 (사이드바 + 상단바 + 통계 + 최근 공고).
 * 상세 지원 관리(보드/리스트)는 /applications 로 분리됨.
 * /dashboard(로그인 필요) 에서 렌더한다.
 */
export default function DashboardScreen({
  t,
  summary,
  deltas,
  real,
  userEmail,
  needsOnboarding = false,
  recentJobs = [],
}: {
  t: Dictionary
  summary: DashboardSummary
  deltas?: string[]
  real: boolean
  userEmail?: string | null
  needsOnboarding?: boolean
  /** 요약에 노출할 최근 공고 (실데이터에서만 제공) */
  recentJobs?: JobItem[]
}) {
  const today = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'full' }).format(new Date())

  return (
    <div className="flex min-h-screen bg-[#F7F8FA] text-[#111827]">
      <Sidebar t={t} userName={summary.userName} userEmail={userEmail} activeKey="dashboard" />

      <main className="min-w-0 flex-1">
        <Topbar t={t} userName={summary.userName} userEmail={userEmail} />

        <div className="px-4 pb-16 pt-[30px] sm:px-6 lg:px-9">
          {/* 온보딩 미완료 유저 → 프로필 완성 유도 */}
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

          {/* 최근 공고 요약 — 상세는 /applications */}
          <div className="mt-6 rounded-[14px] border border-[#ECEEF0] bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="m-0 text-[18px] font-bold tracking-[-0.01em] text-[#101828]">
                  {t.dashboard.boardTitle}
                </h2>
                <p className="mt-1 text-[13px] text-[#98A2B3]">최근 공고를 한눈에 확인하세요</p>
              </div>
              <Link
                href="/applications"
                className="inline-flex shrink-0 items-center gap-1 rounded-[9px] bg-[#F4F6F8] px-3.5 py-2 text-[13px] font-semibold text-[#344054] transition-colors hover:bg-[#ECEEF0]"
              >
                전체 보기 <ArrowRight size={14} />
              </Link>
            </div>

            {!real || recentJobs.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-[#98A2B3]">
                {real
                  ? '아직 공고가 없습니다. 잡 탐색에서 관심 공고를 추가해보세요.'
                  : '로그인하면 내 공고가 여기에 표시됩니다.'}
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-[#F0F2F4]">
                {recentJobs.slice(0, 5).map(job => (
                  <li key={job.id}>
                    <Link
                      href={`/workspace?jobId=${encodeURIComponent(job.id)}`}
                      className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-[#FAFBFC]"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-semibold text-[#1F2A37]">{job.title}</div>
                        <div className="mt-0.5 truncate text-[12.5px] text-[#98A2B3]">
                          {job.company}
                          {job.location ? ` · ${job.location}` : ''}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full bg-[#F4F6F8] px-2.5 py-1 text-[11.5px] font-medium text-[#667085]">
                          {STATUS_LABEL[job.match_status ?? 'new'] ?? '준비 중'}
                        </span>
                        {job.match_score !== null && (
                          <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${matchTone(job.match_score)}`}>
                            {job.match_score}%
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
