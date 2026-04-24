'use client'

import { useState } from 'react'
import { generateCoverLetter } from '@/app/actions'

interface Props {
  jobId: string
  jobTitle: string
  company: string
  onClose: () => void
}

export default function CoverLetterModal({ jobId, jobTitle, company, onClose }: Props) {
  const [content, setContent] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    setError('')
    const res = await generateCoverLetter(jobId)
    setGenerating(false)
    if (res.error) setError(res.error)
    else if (res.content) setContent(res.content)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* 헤더 */}
        <div className="flex items-start justify-between p-6 border-b border-zinc-100">
          <div>
            <h2 className="font-bold text-lg">커버레터 작성</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{jobTitle} · {company}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">✕</button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!content && !generating && (
            <div className="text-center py-8">
              <p className="text-sm text-zinc-400 mb-4">이력서와 JD를 분석해 맞춤 커버레터를 생성합니다.</p>
              <button
                onClick={handleGenerate}
                className="bg-zinc-900 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                ✦ AI 커버레터 생성
              </button>
              {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
            </div>
          )}

          {generating && (
            <div className="text-center py-8 text-sm text-zinc-400">
              커버레터 작성 중...
            </div>
          )}

          {content && (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full text-sm leading-relaxed border border-zinc-200 rounded-xl p-4 outline-none focus:border-zinc-400 resize-none"
              rows={16}
            />
          )}
        </div>

        {/* 푸터 */}
        {content && (
          <div className="flex items-center justify-between p-6 border-t border-zinc-100">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="text-sm text-zinc-400 hover:text-zinc-600 disabled:opacity-50"
            >
              {generating ? '생성 중...' : '↺ 재생성'}
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="text-sm border border-zinc-200 px-4 py-2 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                {copied ? '✓ 복사됨' : '클립보드 복사'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
