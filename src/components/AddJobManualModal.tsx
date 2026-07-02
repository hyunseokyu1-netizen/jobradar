'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addJobManually } from '@/app/actions'

interface Props {
  onClose: () => void
}

/**
 * URL 없이 채용공고를 직접 입력해 카드를 생성하는 모달.
 * 링크 복사가 막힌 사이트 대응 — 직무명만 필수, JD 입력 시 자동 AI 매칭.
 */
export default function AddJobManualModal({ onClose }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'matching'>('idle')
  const [error, setError] = useState('')

  const busy = status !== 'idle'

  async function handleSubmit() {
    if (!title.trim() || busy) return
    setError('')
    setStatus('saving')

    const fd = new FormData()
    fd.append('title', title.trim())
    fd.append('company', company.trim())
    fd.append('location', location.trim())
    fd.append('description', description.trim())

    if (description.trim()) setStatus('matching')
    const res = await addJobManually(fd)
    setStatus('idle')

    if (res.error) {
      setError(res.error)
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-start justify-between p-6 border-b border-[#F0F2F4]">
          <div>
            <h2 className="font-bold text-lg">채용공고 직접 추가</h2>
            <p className="text-sm text-[#667085] mt-0.5">
              링크 복사가 안 되는 사이트는 내용을 직접 입력해 카드를 만드세요.
            </p>
          </div>
          <button onClick={onClose} className="text-[#98A2B3] hover:text-[#475467] text-xl leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#667085] mb-1">
              직무명 <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="예: Senior Backend Engineer"
              className="w-full text-sm border border-[#ECEEF0] rounded-lg px-3 py-2.5 outline-none focus:border-[#046C4E] transition-colors placeholder:text-[#D0D5DB]"
              autoFocus
              disabled={busy}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#667085] mb-1">회사</label>
              <input
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="예: Spotify"
                className="w-full text-sm border border-[#ECEEF0] rounded-lg px-3 py-2.5 outline-none focus:border-[#046C4E] transition-colors placeholder:text-[#D0D5DB]"
                disabled={busy}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#667085] mb-1">위치</label>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="예: 시드니, 호주 · 원격"
                className="w-full text-sm border border-[#ECEEF0] rounded-lg px-3 py-2.5 outline-none focus:border-[#046C4E] transition-colors placeholder:text-[#D0D5DB]"
                disabled={busy}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#667085] mb-1">
              채용공고 내용 (JD) <span className="text-[#D0D5DB]">— 선택</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="채용 공고 전문을 붙여넣으면 저장 후 자동으로 AI 매칭이 실행됩니다."
              className="w-full text-sm border border-[#ECEEF0] rounded-xl p-4 outline-none focus:border-[#046C4E] resize-none placeholder:text-[#D0D5DB]"
              rows={10}
              disabled={busy}
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-[#F0F2F4]">
          <span className="text-xs text-[#98A2B3]">
            {status === 'saving' && '저장 중...'}
            {status === 'matching' && 'AI 매칭 중...'}
            {status === 'idle' && description.trim() && `${description.trim().length}자`}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm text-[#98A2B3] hover:text-[#475467] px-4 py-2" disabled={busy}>
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || busy}
              className="text-sm bg-[#046C4E] text-white px-5 py-2 rounded-lg hover:bg-[#035A40] disabled:opacity-50 transition-colors"
            >
              {description.trim() ? '추가 후 매칭' : '카드 추가'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
