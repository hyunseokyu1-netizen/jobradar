'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateJobMemo } from '@/app/actions'

/** 공고 메모 편집 모달 (옛 JobList 인라인 메모 이식) */
export default function MemoModal({
  jobId,
  jobTitle,
  company,
  initialMemo,
  onClose,
}: {
  jobId: string
  jobTitle: string
  company: string
  initialMemo: string | null
  onClose: () => void
}) {
  const router = useRouter()
  const [memo, setMemo] = useState(initialMemo ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setSaving(true)
    setError('')
    const res = await updateJobMemo(jobId, memo)
    if (res.error) {
      setError(res.error)
      setSaving(false)
      return
    }
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-zinc-100 p-6">
          <div>
            <h2 className="text-lg font-bold">메모</h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              {jobTitle} · {company}
            </p>
          </div>
          <button onClick={onClose} className="text-xl leading-none text-zinc-400 hover:text-zinc-600">
            ✕
          </button>
        </div>
        <div className="p-6">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="이 공고에 대한 메모를 남겨두세요..."
            className="w-full resize-none rounded-xl border border-zinc-200 p-4 text-sm outline-none placeholder:text-zinc-300 focus:border-zinc-400"
            rows={8}
            autoFocus
          />
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
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
