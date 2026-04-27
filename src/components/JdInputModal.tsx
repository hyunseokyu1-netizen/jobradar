'use client'

import { useState } from 'react'
import { updateJobDescription, matchSingleJob } from '@/app/actions'

interface Props {
  jobId: string
  jobTitle: string
  company: string
  onClose: () => void
  onMatched: (score: number) => void
}

export default function JdInputModal({ jobId, jobTitle, company, onClose, onMatched }: Props) {
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'matching'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!description.trim()) return
    setStatus('saving')
    setError('')

    const saveRes = await updateJobDescription(jobId, description.trim())
    if (saveRes.error) {
      setError(saveRes.error)
      setStatus('idle')
      return
    }

    setStatus('matching')
    const matchRes = await matchSingleJob(jobId)
    setStatus('idle')

    if (matchRes.error) {
      setError(matchRes.error)
    } else if (matchRes.score !== undefined) {
      onMatched(matchRes.score)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-start justify-between p-6 border-b border-zinc-100">
          <div>
            <h2 className="font-bold text-lg">JD 직접 입력</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{jobTitle} · {company}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-zinc-500 mb-3">
            채용 공고 페이지에서 JD 전문을 복사해 붙여넣으세요. 저장 후 자동으로 AI 매칭이 실행됩니다.
          </p>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="채용 공고 내용을 붙여넣으세요..."
            className="w-full text-sm border border-zinc-200 rounded-xl p-4 outline-none focus:border-zinc-400 resize-none placeholder:text-zinc-300"
            rows={14}
            autoFocus
          />
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-zinc-100">
          <span className="text-xs text-zinc-400">
            {status === 'saving' && 'JD 저장 중...'}
            {status === 'matching' && 'AI 매칭 중...'}
            {status === 'idle' && description && `${description.length}자`}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm text-zinc-400 hover:text-zinc-600 px-4 py-2"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!description.trim() || status !== 'idle'}
              className="text-sm bg-zinc-900 text-white px-5 py-2 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              저장 후 매칭
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
