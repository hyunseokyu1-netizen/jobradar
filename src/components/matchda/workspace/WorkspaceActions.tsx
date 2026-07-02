'use client'

import { useState } from 'react'
import CoverLetterModal from '@/components/CoverLetterModal'
import TailoredResumeModal from '@/components/TailoredResumeModal'
import { FileText, Sparkle } from '../ui/icons'

/**
 * 워크스페이스 per-job 액션 진입점 (로그인 실데이터에서만).
 * 옛 JobList의 커버레터·맞춤 이력서 모달을 그대로 재사용해 이식.
 */
export default function WorkspaceActions({
  jobId,
  jobTitle,
  company,
}: {
  jobId: string
  jobTitle: string
  company: string
}) {
  const [cover, setCover] = useState(false)
  const [tailored, setTailored] = useState(false)

  const btn =
    'flex items-center gap-[6px] rounded-[9px] border border-[#E2E6EA] bg-white px-3 py-[8px] text-[13px] font-semibold text-[#475467] hover:bg-[#F4F6F8]'

  return (
    <>
      <button type="button" onClick={() => setCover(true)} className={btn}>
        <FileText size={15} className="text-[#046C4E]" />
        <span className="hidden sm:inline">커버레터</span>
      </button>
      <button type="button" onClick={() => setTailored(true)} className={btn}>
        <Sparkle size={15} strokeWidth={1.8} className="text-[#046C4E]" />
        <span className="hidden sm:inline">맞춤 이력서</span>
      </button>

      {cover && (
        <CoverLetterModal
          jobId={jobId}
          jobTitle={jobTitle}
          company={company}
          onClose={() => setCover(false)}
        />
      )}
      {tailored && (
        <TailoredResumeModal
          jobId={jobId}
          jobTitle={jobTitle}
          company={company}
          onClose={() => setTailored(false)}
        />
      )}
    </>
  )
}
