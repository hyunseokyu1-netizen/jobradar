import Link from 'next/link'
import { ArrowLeft, Check, ArrowRight } from '../ui/icons'
import type { ResumeWorkspaceData } from '@/lib/matchda/types'
import type { Dictionary } from '@/lib/matchda/i18n'

/** 워크스페이스 상단바 (64px) */
export default function WorkspaceTopbar({
  t,
  data,
  actions,
}: {
  t: Dictionary
  data: ResumeWorkspaceData
  /** per-job 액션(커버레터·맞춤이력서 등) 슬롯 — 실데이터에서만 */
  actions?: React.ReactNode
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-[#ECEEF0] bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-[14px]">
        <Link
          href="/applications"
          className="flex flex-shrink-0 items-center gap-[6px] rounded-[9px] border border-[#ECEEF0] bg-[#F4F6F8] px-3 py-2 text-[13px] font-semibold text-[#475467] hover:bg-[#EAEDEF]"
        >
          <ArrowLeft size={15} />
          <span className="hidden sm:inline">{t.workspace.back}</span>
        </Link>
        <div className="hidden h-[26px] w-px bg-[#ECEEF0] sm:block" />
        <div className="min-w-0">
          <div className="truncate text-[15px] font-bold tracking-[-0.01em] text-[#101828]">
            {t.workspace.docTitlePrefix}
            {data.docTitle}
          </div>
          <div className="mt-[1px] flex items-center gap-[6px] truncate text-[12px] text-[#98A2B3]">
            <span
              className="inline-flex h-[14px] w-[14px] items-center justify-center rounded-[4px] text-[9px] font-bold text-white"
              style={{ background: data.target.brand.color }}
            >
              {data.target.brand.initial}
            </span>
            {data.target.company} · {data.target.location}
          </div>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
        {actions}
        <div className="hidden items-center gap-[5px] text-[12px] text-[#98A2B3] lg:flex">
          <Check size={14} className="text-[#046C4E]" />
          {t.workspace.autoSaved}
        </div>
        {/* 외부 공고 페이지 열기 — 링크를 열어도 지원 완료로 처리하지 않는다 (실제 제출 후
            사용자가 직접 상태를 바꾸는 것이 정확). 직접 입력 공고(URL 없음)는 버튼 미노출. */}
        {data.jobExtra?.applyUrl && (
          <a
            href={data.jobExtra.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="공고 페이지를 새 탭으로 엽니다. 제출을 마치면 지원 상태를 '지원 완료'로 바꿔주세요."
            className="flex items-center gap-[7px] rounded-[9px] bg-[#046C4E] px-3 py-[10px] text-[14px] font-semibold text-white shadow-[0_1px_2px_rgba(4,108,78,0.25)] hover:bg-[#035A40] sm:px-[18px]"
          >
            <ArrowRight size={16} className="text-white" />
            <span className="hidden sm:inline">{t.workspace.apply}</span>
          </a>
        )}
      </div>
    </header>
  )
}
