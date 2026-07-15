import { getMatchdaDict } from '@/lib/matchda/i18n'
import { getWorkspaceData } from '@/lib/matchda/mock-data'
import { getMatchdaWorkspace } from '@/lib/matchda/data'
import WorkspaceTopbar from '@/components/matchda/workspace/WorkspaceTopbar'
import OptimizationBanner from '@/components/matchda/workspace/OptimizationBanner'
import ResumeDocument from '@/components/matchda/workspace/ResumeDocument'
import WorkspaceActions from '@/components/matchda/workspace/WorkspaceActions'
import WorkspaceResume from '@/components/matchda/workspace/WorkspaceResume'
import ConnectResumeGate from '@/components/matchda/workspace/ConnectResumeGate'
import { Sparkle } from '@/components/matchda/ui/icons'
import { toStudioResume } from '@/lib/resume'

export const dynamic = 'force-dynamic'

export default async function MatchdaWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>
}) {
  const t = getMatchdaDict('ko')
  const { jobId } = await searchParams

  // 로그인 + jobId + 영어 이력서 작성 시 실데이터, 그 외 목업 데모로 폴백
  const result = await getMatchdaWorkspace(jobId)

  // 내 공고인데 구조화 이력서가 없음 → 목업(가짜 이력서) 대신 연결 안내
  if (result && 'gate' in result) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] text-[#111827]">
        <ConnectResumeGate hasResumeText={result.hasResumeText} />
      </div>
    )
  }

  const real = result
  const data = real ?? getWorkspaceData()

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#111827]">
      <WorkspaceTopbar
        t={t}
        data={data}
        actions={
          real && jobId ? (
            <WorkspaceActions
              jobId={jobId}
              jobTitle={data.target.role}
              company={data.target.company}
              description={data.jobExtra?.description ?? null}
              memo={data.jobExtra?.memo ?? null}
              appliedResumeFilename={data.jobExtra?.appliedResumeFilename ?? null}
              appliedResumeText={data.jobExtra?.appliedResumeText ?? null}
              appliedDocuments={data.jobExtra?.appliedDocuments ?? []}
              location={data.jobExtra?.location ?? data.target.location}
              appliedAt={data.jobExtra?.appliedAt ?? null}
              status={data.jobExtra?.status ?? null}
            />
          ) : undefined
        }
      />
      <OptimizationBanner t={t} data={data} jobId={real && jobId ? jobId : undefined} />

      {real && jobId ? (
        /* 실데이터: 편집 가능한 한국어 원본 + 영문 + AI 어시스턴트 채팅 */
        <WorkspaceResume
          jobId={jobId}
          initialKo={data.koStudio ?? toStudioResume(null)}
          initialEnDoc={data.translated}
          design={data.design}
          note={data.optimizationNote}
          contact={data.email ?? ''}
          jobContext={{
            title: data.target.role,
            company: data.target.company,
            description: data.jobExtra?.description ?? null,
          }}
          labels={{
            original: t.workspace.originalLabel,
            translated: t.workspace.translatedLabel,
            translating: t.workspace.translating,
            sections: t.workspace.sections,
            sectionsEn: t.workspace.sectionsEn,
            optimizeButton: t.workspace.optimizeButton,
            optimizing: t.workspace.optimizing,
          }}
        />
      ) : (
        /* 목업 데모: 읽기 전용 비교 뷰 */
        <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-[22px] px-4 pb-20 pt-6 sm:px-7 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-lg border border-[#E2E6EA] bg-white px-3 py-[6px]">
                <span className="h-[7px] w-[7px] rounded-full bg-[#98A2B3]" />
                <span className="text-[13px] font-semibold text-[#475467]">{t.workspace.originalLabel}</span>
              </div>
            </div>
            <ResumeDocument doc={data.original} labels={t.workspace.sections} variant="original" design={data.design} />
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-[#CEEBDC] bg-[#ECFDF3] px-3 py-[6px]">
                <Sparkle size={14} strokeWidth={1.8} className="text-[#046C4E]" />
                <span className="text-[13px] font-semibold text-[#046C4E]">{t.workspace.translatedLabel}</span>
              </div>
            </div>
            <ResumeDocument
              doc={data.translated}
              labels={t.workspace.sectionsEn}
              variant="translated"
              note={data.optimizationNote}
              design={data.design}
            />
          </div>
        </div>
      )}
    </div>
  )
}
