'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminDeleteFeedback, adminSetFeedbackPublic } from './actions'

export interface AdminFeedbackItem {
  id: string
  rating: number
  content: string
  allowPublic: boolean
  displayName: string | null
  userEmail: string
  createdAt: string
  updatedAt: string
}

/** 관리자 후기 카드 — 공개 토글 + 삭제 */
export default function FeedbackRow({ item }: { item: AdminFeedbackItem }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function togglePublic() {
    setBusy(true)
    setError('')
    const res = await adminSetFeedbackPublic(item.id, !item.allowPublic)
    setBusy(false)
    if (res.error) { setError(res.error); return }
    router.refresh()
  }

  async function remove() {
    if (!confirm(`${item.userEmail} 님의 후기를 삭제할까요? 되돌릴 수 없습니다.`)) return
    setBusy(true)
    setError('')
    const res = await adminDeleteFeedback(item.id)
    setBusy(false)
    if (res.error) { setError(res.error); return }
    router.refresh()
  }

  return (
    <li className="rounded-xl border border-[#ECEEF0] bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm">{'⭐'.repeat(item.rating)}<span className="opacity-25 grayscale">{'⭐'.repeat(5 - item.rating)}</span></span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            item.allowPublic ? 'bg-[#ECFDF3] text-[#046C4E]' : 'bg-[#F4F6F8] text-[#98A2B3]'
          }`}
        >
          {item.allowPublic ? '공개 동의' : '비공개'}
        </span>
        <span className="ml-auto text-[11px] text-[#98A2B3]">
          {new Date(item.updatedAt).toLocaleString('ko-KR')}
        </span>
      </div>

      {item.content ? (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#344054]">{item.content}</p>
      ) : (
        <p className="mt-2 text-sm text-[#C4CAD2]">(별점만 남김)</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#F0F2F4] pt-2.5 text-[12px]">
        <span className="text-[#667085]">{item.userEmail}</span>
        {item.displayName && <span className="text-[#98A2B3]">공개 이름: {item.displayName}</span>}
        <span className="ml-auto flex gap-3">
          <button
            type="button"
            onClick={togglePublic}
            disabled={busy}
            className="font-medium text-[#046C4E] hover:underline disabled:opacity-40"
          >
            {item.allowPublic ? '공개 해제' : '공개 허용'}
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="text-[#B0B7C0] hover:text-red-500 disabled:opacity-40"
          >
            삭제
          </button>
        </span>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </li>
  )
}
