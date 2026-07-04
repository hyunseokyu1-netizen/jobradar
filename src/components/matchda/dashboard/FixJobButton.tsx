'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { fixJobWithText } from '@/app/actions'

/**
 * 제목 파싱 실패 공고 카드에서 JD 원문을 붙여넣어 재분석·보정하는 버튼+모달.
 */
export default function FixJobButton({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleFix() {
    if (!text.trim() || busy) return
    setBusy(true)
    setError('')
    const res = await fixJobWithText(jobId, text)
    setBusy(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setOpen(false)
    setText('')
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={e => {
          e.stopPropagation()
          setOpen(true)
        }}
        className="mt-1 inline-flex items-center gap-1 rounded-md border border-[#CEEBDC] bg-[#ECFDF3] px-2 py-0.5 text-[11px] font-medium text-[#046C4E] transition-colors hover:bg-[#D9F5E7]"
      >
        📋 JD 직접 입력
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={e => {
            e.stopPropagation()
            setOpen(false)
          }}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b border-[#F0F2F4] p-5">
              <h3 className="text-base font-bold text-[#101828]">JD 직접 입력으로 공고 정보 채우기</h3>
              <p className="mt-1 text-xs text-[#667085]">
                공고 페이지에서 <kbd className="rounded border border-[#ECEEF0] bg-[#F7F8FA] px-1">Ctrl+A</kbd> → <kbd className="rounded border border-[#ECEEF0] bg-[#F7F8FA] px-1">Ctrl+C</kbd> 로 전체 복사한 내용을 붙여넣으면
                AI가 제목·회사·위치·JD를 분석해서 채우고 매칭까지 실행합니다.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="복사한 공고 페이지 내용을 여기에 붙여넣기 (Ctrl+V)"
                className="w-full resize-none rounded-xl border border-[#ECEEF0] p-4 text-sm outline-none placeholder:text-[#D0D5DB] focus:border-[#046C4E]"
                rows={10}
                autoFocus
                disabled={busy}
              />
              {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
            </div>
            <div className="flex items-center justify-between border-t border-[#F0F2F4] p-5">
              <span className="text-xs text-[#98A2B3]">{text.trim() ? `${text.trim().length}자` : ''}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setOpen(false)}
                  disabled={busy}
                  className="px-4 py-2 text-sm text-[#98A2B3] hover:text-[#475467]"
                >
                  취소
                </button>
                <button
                  onClick={handleFix}
                  disabled={!text.trim() || busy}
                  className="rounded-lg bg-[#046C4E] px-5 py-2 text-sm text-white transition-colors hover:bg-[#035A40] disabled:opacity-50"
                >
                  {busy ? 'AI 분석·매칭 중…' : '분석해서 채우기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
