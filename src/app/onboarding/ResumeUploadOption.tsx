'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { analyzeResumeFile } from '@/app/profile/actions'

/**
 * 온보딩 상단의 "이력서 파일로 시작하기" 옵션.
 * 이미 이력서가 있는 유저는 8단계 채팅 대신 PDF·DOCX 업로드 한 번으로
 * AI 구조화(analyzeResumeFile: onboarding_ko/en + 완료 처리)까지 끝낸다.
 */
export default function ResumeUploadOption() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError('')

    const fd = new FormData()
    fd.append('resume', file)
    const res = await analyzeResumeFile(fd)

    if (res.error) {
      setBusy(false)
      setError(res.error)
      e.target.value = ''
      return
    }

    // 파싱 결과 확인·수정할 수 있도록 이력서 스튜디오로 이동
    router.push('/profile')
    router.refresh()
  }

  return (
    <div className="mb-4 rounded-2xl border border-[#CEEBDC] bg-[#ECFDF3] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#046C4E]">이미 이력서 파일이 있으신가요?</p>
          <p className="mt-0.5 text-xs text-[#4B5563]">
            PDF·DOCX를 올리면 AI가 분석해 프로필을 바로 완성해 드려요. 채팅 입력은 건너뛰어도 됩니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="shrink-0 rounded-[10px] bg-[#046C4E] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#035A40] disabled:opacity-50"
        >
          {busy ? 'AI 분석 중... (최대 30초)' : '📄 이력서 업로드로 시작'}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleFile}
        disabled={busy}
      />
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  )
}
