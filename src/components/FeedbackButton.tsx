'use client'

import { useState, useEffect } from 'react'
import { getMyFeedback, submitFeedback } from '@/app/feedback-actions'

/**
 * 체험 후기 버튼 + 작성 모달.
 * 사이드바·모바일 메뉴에서 사용. 유저당 후기 1개(다시 열면 기존 내용 수정).
 */
export default function FeedbackButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          'flex w-full items-center gap-[11px] rounded-[10px] px-3 py-[10px] text-[14px] font-medium text-[#475467] hover:bg-[#F4F6F8]'
        }
      >
        💬 체험 후기 남기기
      </button>
      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  )
}

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [isEdit, setIsEdit] = useState(false)

  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [content, setContent] = useState('')
  const [allowPublic, setAllowPublic] = useState(false)
  const [displayName, setDisplayName] = useState('')

  // 기존 후기 프리필 (수정 모드)
  useEffect(() => {
    let cancelled = false
    getMyFeedback().then(res => {
      if (cancelled) return
      if (res.feedback) {
        setRating(res.feedback.rating)
        setContent(res.feedback.content)
        setAllowPublic(res.feedback.allowPublic)
        setDisplayName(res.feedback.displayName)
        setIsEdit(true)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  async function handleSubmit() {
    if (rating < 1) { setError('별점을 선택해주세요.'); return }
    setSaving(true)
    setError('')
    const res = await submitFeedback({ rating, content, allowPublic, displayName })
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setDone(true)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85dvh] w-full max-w-md flex-col overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#F0F2F4] p-5">
          <div>
            <h2 className="font-semibold text-[#101828]">{isEdit ? '내 후기 수정' : '체험 후기'}</h2>
            <p className="mt-0.5 text-xs text-[#98A2B3]">
              솔직한 후기가 매치다를 만듭니다. 불편했던 점도 환영해요.
            </p>
          </div>
          <button onClick={onClose} className="text-xl leading-none text-[#98A2B3] transition-colors hover:text-[#475467]">✕</button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="text-3xl">🙏</div>
            <p className="mt-3 text-sm font-semibold text-[#101828]">후기가 저장됐어요. 감사합니다!</p>
            <p className="mt-1 text-xs text-[#98A2B3]">언제든 다시 열어 수정할 수 있어요.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-[9px] bg-[#046C4E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#035A40]"
            >
              닫기
            </button>
          </div>
        ) : loading ? (
          <p className="p-8 text-center text-sm text-[#98A2B3]">불러오는 중...</p>
        ) : (
          <div className="space-y-4 p-5">
            {/* 별점 */}
            <div>
              <p className="mb-1.5 text-sm font-medium text-[#344054]">전체적으로 어떠셨나요?</p>
              <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n}점`}
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    className={`text-2xl transition-transform hover:scale-110 ${
                      n <= (hover || rating) ? '' : 'opacity-25 grayscale'
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            {/* 내용 */}
            <div>
              <p className="mb-1.5 text-sm font-medium text-[#344054]">
                자세한 후기 <span className="font-normal text-[#98A2B3]">(선택)</span>
              </p>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="좋았던 점, 불편했던 점, 바라는 기능 등 자유롭게 적어주세요."
                className="w-full resize-y rounded-xl border border-[#E2E6EA] px-3.5 py-2.5 text-sm outline-none focus:border-[#046C4E] focus:ring-2 focus:ring-[#046C4E]/10"
              />
            </div>

            {/* 공개 동의 */}
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={allowPublic}
                onChange={e => setAllowPublic(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#046C4E]"
              />
              <span className="text-xs leading-relaxed text-[#667085]">
                이 후기를 매치다 소개 페이지에 게재하는 데 동의합니다. (이메일은 공개되지 않아요)
              </span>
            </label>
            {allowPublic && (
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={40}
                placeholder="공개 시 표시할 이름 (예: 현석 · 시드니 취업 준비)"
                className="w-full rounded-xl border border-[#E2E6EA] px-3.5 py-2.5 text-sm outline-none focus:border-[#046C4E]"
              />
            )}

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="w-full rounded-[10px] bg-[#046C4E] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#035A40] disabled:opacity-50"
            >
              {saving ? '저장 중...' : isEdit ? '후기 수정하기' : '후기 보내기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
