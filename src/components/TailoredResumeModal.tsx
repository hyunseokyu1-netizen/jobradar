'use client'

import { useState, useEffect } from 'react'
import { generateTailoredResume, getTailoredResume, saveTailoredResume, generateTailoredResumeDocx } from '@/app/actions'
import { downloadTxt, downloadDocx, downloadPdf } from '@/lib/download'

interface Props {
  jobId: string
  jobTitle: string
  company: string
  onClose: () => void
}

type ActionState = 'idle' | 'loading' | 'saving' | 'generating' | 'generatingDocx'

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
  const [downloading, setDownloading] = useState<'txt' | 'docx' | 'pdf' | null>(null)

  const filename = `resume_${company.replace(/\s+/g, '_')}_${jobTitle.replace(/\s+/g, '_')}`.slice(0, 60)
  const isDirty = content !== savedContent

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

  async function handleGenerateDocx() {
    setState('generatingDocx')
    setError('')
    const res = await generateTailoredResumeDocx(jobId)
    setState('idle')
    if (res.error) setError(res.error)
    else if (res.base64 && res.filename) downloadBase64Docx(res.base64, res.filename)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDownload(type: 'txt' | 'docx' | 'pdf') {
    setDownloading(type)
    try {
      if (type === 'txt') await downloadTxt(content, filename)
      else if (type === 'docx') await downloadDocx(content, filename)
      else await downloadPdf(content, filename)
    } finally {
      setDownloading(null)
    }
  }

  const isLoading = state !== 'idle'

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

          {state !== 'loading' && state !== 'generating' && state !== 'generatingDocx' && !content && (
            <div className="text-center py-8">
              <p className="text-sm text-zinc-400 mb-4">
                프로필의 원본 이력서를 이 공고의 JD에 맞춰 재구성한 이력서를 생성합니다.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="bg-zinc-900 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                >
                  ✦ 텍스트로 생성
                </button>
                <button
                  onClick={handleGenerateDocx}
                  disabled={isLoading}
                  className="border border-emerald-300 text-emerald-700 text-sm px-5 py-2.5 rounded-lg hover:bg-emerald-50 disabled:opacity-50 transition-colors"
                >
                  📄 원본 양식 유지 DOCX
                </button>
              </div>
              <p className="text-xs text-zinc-400 mt-3">
                DOCX 방식은 업로드한 원본 이력서의 서식·레이아웃을 그대로 두고 내용만 JD에 맞춰 수정합니다.
              </p>
              {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
            </div>
          )}

          {state === 'generating' && (
            <div className="text-center py-8 text-sm text-zinc-400">JD를 분석해 이력서 작성 중... (최대 1분)</div>
          )}

          {state === 'generatingDocx' && (
            <div className="text-center py-8 text-sm text-zinc-400">원본 양식을 유지하며 내용 수정 중... (최대 1분)</div>
          )}

          {content && state !== 'generating' && state !== 'generatingDocx' && (
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
        {content && state !== 'generating' && state !== 'generatingDocx' && state !== 'loading' && (
          <div className="p-6 border-t border-zinc-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="text-xs text-zinc-400 hover:text-zinc-600 disabled:opacity-50 border border-zinc-200 px-3 py-1.5 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  ↺ 재생성
                </button>
                <button
                  onClick={handleGenerateDocx}
                  disabled={isLoading}
                  className="text-xs text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-50 disabled:opacity-50 transition-colors"
                >
                  📄 원본 양식 DOCX
                </button>
              </div>
              <div className="flex gap-2">
                {isDirty && (
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="text-xs bg-zinc-900 text-white px-3 py-1.5 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                  >
                    {state === 'saving' ? '저장 중...' : saved ? '✓ 저장됨' : '저장'}
                  </button>
                )}
                {!isDirty && savedContent && (
                  <span className="text-xs text-zinc-400 px-3 py-1.5">{saved ? '✓ 저장됨' : '저장됨'}</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handleCopy}
                className="text-xs border border-zinc-200 px-3 py-1.5 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                {copied ? '✓ 복사됨' : '클립보드 복사'}
              </button>
              <div className="flex gap-2">
                {(['txt', 'docx', 'pdf'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => handleDownload(type)}
                    disabled={!!downloading}
                    className="text-xs border border-zinc-200 px-3 py-1.5 rounded-lg hover:bg-zinc-50 disabled:opacity-50 transition-colors uppercase"
                  >
                    {downloading === type ? '...' : type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
