import { getMatchdaDict } from '@/lib/matchda/i18n'
import { getWorkspaceData } from '@/lib/matchda/mock-data'
import WorkspaceTopbar from '@/components/matchda/workspace/WorkspaceTopbar'
import OptimizationBanner from '@/components/matchda/workspace/OptimizationBanner'
import ResumeDocument from '@/components/matchda/workspace/ResumeDocument'
import { Sparkle } from '@/components/matchda/ui/icons'

// TODO(api): getWorkspaceData 를 실제 이력서 원본/번역본 + 타깃 공고 조회로 대체
export default function MatchdaWorkspacePage() {
  const t = getMatchdaDict('ko')
  const data = getWorkspaceData()

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#111827]">
      <WorkspaceTopbar t={t} data={data} />
      <OptimizationBanner t={t} data={data} />

      <div className="mx-auto grid max-w-[1320px] grid-cols-2 gap-[22px] px-7 pb-20 pt-6">
        {/* 좌: 원본 (한국어) */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-lg border border-[#E2E6EA] bg-white px-3 py-[6px]">
              <span className="h-[7px] w-[7px] rounded-full bg-[#98A2B3]" />
              <span className="text-[13px] font-semibold text-[#475467]">
                {t.workspace.originalLabel}
              </span>
            </div>
            <span className="text-[12px] text-[#98A2B3]">{t.workspace.originalMeta}</span>
          </div>
          <ResumeDocument doc={data.original} labels={t.workspace.sections} variant="original" />
        </div>

        {/* 우: AI 번역 · 맞춤화 (영어) */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-lg border border-[#CEEBDC] bg-[#ECFDF3] px-3 py-[6px]">
              <Sparkle size={14} strokeWidth={1.8} className="text-[#046C4E]" />
              <span className="text-[13px] font-semibold text-[#046C4E]">
                {t.workspace.translatedLabel}
              </span>
            </div>
            <span className="text-[12px] text-[#98A2B3]">{t.workspace.translatedMeta}</span>
          </div>
          <ResumeDocument
            doc={data.translated}
            labels={t.workspace.sectionsEn}
            variant="translated"
            note={data.optimizationNote}
          />
        </div>
      </div>
    </div>
  )
}
