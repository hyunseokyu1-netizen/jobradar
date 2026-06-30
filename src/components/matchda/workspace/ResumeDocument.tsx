import HighlightText from './HighlightText'
import { Sparkle } from '../ui/icons'
import type { ResumeDocumentData, ResumeWorkspaceData } from '@/lib/matchda/types'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-[14px] mt-7 border-b border-[#EEF0F2] pb-[7px] text-[11px] font-semibold uppercase tracking-[0.09em] text-[#9AA3AD]">
      {children}
    </div>
  )
}

function SkillChip({ text, accent }: { text: string; accent?: boolean }) {
  return accent ? (
    <span className="rounded-[7px] border border-[#CEEBDC] bg-[#ECFDF3] px-[11px] py-[5px] text-[13px] text-[#046C4E]">
      {text}
    </span>
  ) : (
    <span className="rounded-[7px] border border-[#ECEEF0] bg-[#F4F6F8] px-[11px] py-[5px] text-[13px] text-[#475467]">
      {text}
    </span>
  )
}

/**
 * 이력서 문서 페이지 (흰 배경, radius 14px, padding 44/48).
 * variant='translated' 일 때 기술칩 그린 틴트 + 경력 아래 최적화 노트 표시.
 */
export default function ResumeDocument({
  doc,
  labels,
  variant,
  note,
}: {
  doc: ResumeDocumentData
  labels: { experience: string; skills: string; education: string }
  variant: 'original' | 'translated'
  note?: ResumeWorkspaceData['optimizationNote']
}) {
  const accent = variant === 'translated'

  return (
    <div className="rounded-[14px] border border-[#ECEEF0] bg-white px-6 py-8 shadow-[0_2px_14px_rgba(16,24,40,0.04)] sm:px-12 sm:py-11">
      <div className="text-[23px] font-bold tracking-[-0.01em] text-[#101828]">{doc.name}</div>
      <div className="mt-[3px] text-[15px] font-semibold text-[#046C4E]">{doc.title}</div>
      <div className="mt-[6px] font-[family-name:var(--font-plex-mono)] text-[13px] text-[#98A2B3]">
        {doc.contact}
      </div>

      <SectionLabel>{labels.experience}</SectionLabel>
      {doc.experiences.map((exp, ei) => (
        <div key={exp.org} className={ei > 0 ? 'mt-[18px]' : ''}>
          <div className="flex items-baseline justify-between">
            <div className="text-[15px] font-semibold text-[#1F2A37]">{exp.org}</div>
            <div className="text-[12px] text-[#98A2B3]">{exp.period}</div>
          </div>
          <ul className="mt-[9px] list-disc pl-[18px] text-[14px] leading-[1.75] text-[#475467]">
            {exp.bullets.map((b, bi) => (
              <li key={bi}>
                <HighlightText text={b.text} highlights={b.highlights} />
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* 영어 최적화본: 경력 아래 그린 최적화 노트 */}
      {accent && note && (
        <div className="mt-4 flex gap-[10px] rounded-[10px] border border-[#D9EEE4] bg-[#F6FBF8] px-[14px] py-3">
          <Sparkle size={16} strokeWidth={1.8} className="mt-[1px] flex-shrink-0 text-[#046C4E]" />
          <div className="text-[12.5px] leading-[1.55] text-[#3F5249]">
            {note.company} 공고의 <b className="text-[#046C4E]">{note.keyword}</b> {note.body}
          </div>
        </div>
      )}

      <SectionLabel>{labels.skills}</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {doc.skills.map((s) => (
          <SkillChip key={s} text={s} accent={accent} />
        ))}
      </div>

      <SectionLabel>{labels.education}</SectionLabel>
      <div className="flex items-baseline justify-between">
        <div className="text-[14px] font-semibold text-[#1F2A37]">{doc.education.org}</div>
        <div className="text-[12px] text-[#98A2B3]">{doc.education.period}</div>
      </div>
    </div>
  )
}
