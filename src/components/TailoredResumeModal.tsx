'use client'

import { useState, useEffect } from 'react'
import { generateTailoredResume, getTailoredResume, saveTailoredResume, applyTailoredTextToDocx } from '@/app/actions'
import { printPdfFromDocx } from '@/lib/download'

interface Props {
  jobId: string
  jobTitle: string
  company: string
  onClose: () => void
}

type ActionState = 'idle' | 'loading' | 'saving' | 'generating' | 'applyingDocx' | 'applyingPdf'

function downloadBase64Docx(base64: string, filename: string) {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function TailoredResumeModal({ jobId, jobTitle, company, onClose }: Props) {
  const [content, setContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [state, setState] = useState<ActionState>('loading')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  const filename = `resume_${company.replace(/\s+/g, '_')}_${jobTitle.replace(/\s+/g, '_')}`.slice(0, 60)
  const isDirty = content !== savedContent
  const isLoading = state !== 'idle'

  useEffect(() => {
    getTailoredResume(jobId).then(res => {
      if (res.content) {
        setContent(res.content)
        setSavedContent(res.content)
      }
      setState('idle')
    })
  }, [jobId])

  async function handleGenerate() {
    setState('generating')
    setError('')
    const res = await generateTailoredResume(jobId)
    setState('idle')
    if (res.error) setError(res.error)
    else if (res.content) {
      setContent(res.content)
      setSavedContent(res.content)
    }
  }

  async function handleSave() {
    setState('saving')
    const res = await saveTailoredResume(jobId, content)
    setState('idle')
    if (res.error) setError(res.error)
    else {
      setSavedContent(content)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  async function handleDownloadDocx() {
    setState('applyingDocx')
    setError('')
    const res = await applyTailoredTextToDocx(jobId)
    setState('idle')
    if (res.error) setError(res.error)
    else if (res.base64 && res.filename) downloadBase64Docx(res.base64, res.filename)
  }

  async function handleDownloadPdf() {
    setState('applyingPdf')
    setError('')
    const res = await applyTailoredTextToDocx(jobId)
    setState('idle')
    if (res.error) { setError(res.error); return }
    if (res.base64 && res.filename) await printPdfFromDocx(res.base64, res.filename)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const showTextarea = content && state !== 'generating' && state !== 'applyingDocx' && state !== 'applyingPdf'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* 헤더 */}
        <div className="flex items-start justify-between p-6 border-b border-zinc-100">
          <div>
            <h2 className="font-bold text-lg">맞춤 이력서</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{jobTitle} · {company}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">✕</button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-6">
          {state === 'loading' && (
            <div className="text-center py-8 text-sm text-zinc-400">불러오는 중...</div>
          )}

          {state !== 'loading' && state !== 'generating' && !content && (
            <div className="text-center py-12">
              <p className="text-sm text-zinc-400 mb-6">
                프로필의 원본 이력서를 이 공고의 JD에 맞춰 재구성한 이력서를 생성합니다.
              </p>
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="bg-zinc-900 text-white text-sm px-6 py-3 rounded-xl hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                ✦ 맞춤 이력서 생성
              </button>
              {error && <p className="text-xs text-red-500 mt-4">{error}</p>}
            </div>
          )}

          {state === 'generating' && (
            <div className="text-center py-8 text-sm text-zinc-400">JD를 분석해 이력서 작성 중... (최대 1분)</div>
          )}
          {state === 'applyingDocx' && (
            <div className="text-center py-8 text-sm text-zinc-400">원본 양식에 내용 적용 중...</div>
          )}
          {state === 'applyingPdf' && (
            <div className="text-center py-8 text-sm text-zinc-400">PDF 준비 중...</div>
          )}

          {showTextarea && (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full text-sm leading-relaxed border border-zinc-200 rounded-xl p-4 outline-none focus:border-zinc-400 resize-none font-mono"
              rows={20}
            />
          )}

          {error && content && (
            <p className="text-xs text-red-500 mt-2">{error}</p>
          )}
        </div>

        {/* 푸터 */}
        {content && state !== 'generating' && state !== 'loading' && (
          <div className="p-5 border-t border-zinc-100 space-y-3">
            {/* 재생성 + 저장 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="text-xs text-zinc-500 hover:text-zinc-800 disabled:opacity-50 border border-zinc-200 px-3 py-1.5 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  ↺ 재생성
                </button>
                {isDirty ? (
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="text-xs bg-zinc-900 text-white px-3 py-1.5 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                  >
                    {state === 'saving' ? '저장 중...' : '저장'}
                  </button>
                ) : (
                  <span className="text-xs text-zinc-400">{saved ? '✓ 저장됨' : '저장됨'}</span>
                )}
              </div>
              <button
                onClick={handleCopy}
                disabled={isLoading}
                className="text-xs border border-zinc-200 px-3 py-1.5 rounded-lg hover:bg-zinc-50 disabled:opacity-50 transition-colors"
              >
                {copied ? '✓ 복사됨' : '📋 복사'}
              </button>
            </div>

            {/* 다운로드 */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleDownloadDocx}
                disabled={isLoading}
                className="text-xs border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 disabled:opacity-50 transition-colors"
              >
                {state === 'applyingDocx' ? '...' : '원본 양식 DOCX'}
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={isLoading}
                className="text-xs border border-zinc-200 px-3 py-1.5 rounded-lg hover:bg-zinc-50 disabled:opacity-50 transition-colors"
              >
                {state === 'applyingPdf' ? '...' : 'PDF'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
