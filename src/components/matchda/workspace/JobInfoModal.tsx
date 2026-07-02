'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  updateJobTitle,
  updateJobCompany,
  updateJobLocation,
  updateAppliedAt,
} from '@/app/actions'

/** 공고 정보(제목·회사·위치·지원일) 편집 — 옛 JobList 인라인 편집 이식 */
export default function JobInfoModal({
  jobId,
  initialTitle,
  initialCompany,
  initialLocation,
  initialAppliedAt,
  onClose,
}: {
  jobId: string
  initialTitle: string
  initialCompany: string
  initialLocation: string
  initialAppliedAt: string | null
  onClose: () => void
}) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [company, setCompany] = useState(initialCompany)
  const [location, setLocation] = useState(initialLocation)
  // date input 은 YYYY-MM-DD
  const [appliedAt, setAppliedAt] = useState(
    initialAppliedAt ? new Date(initialAppliedAt).toISOString().slice(0, 10) : ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      // 변경된 항목만 저장
      if (title.trim() !== initialTitle) await updateJobTitle(jobId, title.trim())
      if (company.trim() !== initialCompany) await updateJobCompany(jobId, company.trim())
      if (location.trim() !== initialLocation) await updateJobLocation(jobId, location.trim())
      const initDate = initialAppliedAt ? new Date(initialAppliedAt).toISOString().slice(0, 10) : ''
      if (appliedAt !== initDate) {
        const iso = appliedAt ? new Date(appliedAt).toISOString() : ''
        await updateAppliedAt(jobId, iso)
      }
      router.refresh()
      onClose()
    } catch (e) {
      setError(String(e))
      setSaving(false)
    }
  }

  const input =
    'w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-zinc-100 p-6">
          <h2 className="text-lg font-bold">공고 정보 편집</h2>
          <button onClick={onClose} className="text-xl leading-none text-zinc-400 hover:text-zinc-600">
            ✕
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">직무명</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={input} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">회사</label>
              <input value={company} onChange={(e) => setCompany(e.target.value)} className={input} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">위치</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} className={input} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              지원일 <span className="text-zinc-300">— 선택</span>
            </label>
            <input type="date" value={appliedAt} onChange={(e) => setAppliedAt(e.target.value)} className={input} />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 p-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-600" disabled={saving}>
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-[#046C4E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#035A40] disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
