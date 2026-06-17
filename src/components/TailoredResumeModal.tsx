'use client'

import { useState, useEffect, useRef } from 'react'
import {
  generateTailoredResume, getTailoredResume, saveTailoredResume,
  applyTailoredTextToDocx, translateTailoredResume, editTailoredResume,
} from '@/app/actions'
import { printPdfFromDocx } from '@/lib/download'

interface Props {
  jobId: string
  jobTitle: string
  company: string
  onClose: () => void
}

type ActionState = 'idle' | 'loading' | 'saving' | 'generating' | 'applyingDocx' | 'applyingPdf' | 'translating' | 'editing'

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
  const [translation, setTranslation] = useState('')
  const [translationStale, setTranslationStale] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [state, setState] = useState<ActionState>('loading')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  const filename = `resume_${company.replace(/\s+/g, '_')}_${jobTitle.replace(/\s+/g, '_')}`.slice(0, 60)
  const isDirty = content !== savedContent
  const isLoading = state !== 'idle'

  // 영어/한글 패널 스크롤 동기화 (비율 기반)
  const leftRef = useRef<HTMLTextAreaElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const syncing = useRef(false)

  function syncScroll(from: HTMLElement | null, to: HTMLElement | null) {
    if (!from || !to || syncing.current) return
    syncing.current = true
    const denom = from.scrollHeight - from.clientHeight
    const ratio = denom > 0 ? from.scrollTop / denom : 0
    to.scrollTop = ratio * (to.scrollHeight - to.clientHeight)
    requestAnimationFrame(() => { syncing.current = false })
  }

  useEffect(() => {
    getTailoredResume(jobId).then(res => {
      if (res.content) {
        setContent(res.content)
        setSavedContent(res.content)
      }
      setState('idle')
    })
  }, [jobId])

  function updateContent(next: string) {
    setContent(next)
    if (translation) setTranslationStale(true)
  }

  async function handleGenerate() {
    setState('generating')
    setError('')
    const res = await generateTailoredResume(jobId)
    setState('idle')
    if (res.error) setError(res.error)
    else if (res.content) {
      setContent(res.content)
      setSavedContent(res.content)
      setTranslation('')
      setTranslationStale(false)
    }
  }

  async function handleTranslate() {
    setState('translating')
    setError('')
    const res = await translateTailoredResume(content)
    setState('idle')
    if (res.error) setError(res.error)
    else if (res.translation) {
      setTranslation(res.translation)
      setTranslationStale(false)
    }
  }

  async function handleEdit() {
    if (!instruction.trim()) return
    setState('editing')
    setError('')
    const res = await editTailoredResume(jobId, content, instruction)
    setState('idle')
    if (res.error) setError(res.error)
    else if (res.content) {
      setContent(res.content)
      setSavedContent(res.content)
      setInstruction('')
      if (translation) setTranslationStale(true)
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

  const busyOverlay = state === 'generating' || state === 'editing'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-xl">
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

          {state !== 'loading' && !content && !busyOverlay && (
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
          {state === 'editing' && (
            <div className="text-center py-8 text-sm text-zinc-400">요청하신 내용으로 수정 중... (최대 1분)</div>
          )}

          {content && !busyOverlay && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 좌: 영어 (편집 가능) */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1.5 h-5">
                  <span className="text-xs font-semibold text-zinc-500">English (편집 가능)</span>
                </div>
                <textarea
                  ref={leftRef}
                  value={content}
                  onChange={e => updateContent(e.target.value)}
                  onScroll={() => syncScroll(leftRef.current, rightRef.current)}
                  className="w-full h-[58vh] text-sm leading-relaxed border border-zinc-200 rounded-xl p-4 outline-none focus:border-zinc-400 resize-none font-mono"
                />
              </div>

              {/* 우: 한글 번역 (참고용) */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1.5 h-5">
                  <span className="text-xs font-semibold text-zinc-500">한글 번역 (참고용)</span>
                  {content && (
                    <button
                      onClick={handleTranslate}
                      disabled={isLoading}
                      className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50"
                    >
                      {state === 'translating' ? '번역 중...' : translation ? '↺ 다시 번역' : '🇰🇷 한글로 번역'}
                    </button>
                  )}
                </div>
                <div
                  ref={rightRef}
                  onScroll={() => syncScroll(rightRef.current, leftRef.current)}
                  className="w-full h-[58vh] text-sm leading-relaxed border border-zinc-200 rounded-xl p-4 bg-zinc-50 overflow-y-auto whitespace-pre-wrap text-zinc-700"
                >
                  {translation ? (
                    <>
                      {translationStale && (
                        <p className="text-[11px] text-amber-600 mb-2">⚠ 영어 내용이 바뀌었습니다. 다시 번역하세요.</p>
                      )}
                      {translation}
                    </>
                  ) : (
                    <span className="text-zinc-400">
                      {state === 'translating' ? '번역 중...' : '위 “한글로 번역” 버튼을 누르면 참고용 번역이 표시됩니다.'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && content && !busyOverlay && (
            <p className="text-xs text-red-500 mt-2">{error}</p>
          )}
        </div>

        {/* 푸터 */}
        {content && state !== 'loading' && !busyOverlay && (
          <div className="p-5 border-t border-zinc-100 space-y-3">
            {/* 수정 채팅 */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="text-xs text-zinc-500 hover:text-zinc-800 disabled:opacity-50 border border-zinc-200 px-3 py-2 rounded-lg hover:bg-zinc-50 transition-colors whitespace-nowrap"
              >
                ↺ 재생성
              </button>
              <input
                value={instruction}
                onChange={e => setInstruction(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleEdit() }}
                disabled={isLoading}
                placeholder="수정 요청 (예: WORK EXPERIENCE를 더 강조하고, SUMMARY를 2줄로 줄여줘)"
                className="flex-1 text-sm border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-zinc-400 transition-colors disabled:opacity-50"
              />
              <button
                onClick={handleEdit}
                disabled={isLoading || !instruction.trim()}
                className="text-sm bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                ✦ 수정
              </button>
            </div>

            {/* 저장 + 다운로드 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
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
                <button
                  onClick={handleCopy}
                  disabled={isLoading}
                  className="text-xs border border-zinc-200 px-3 py-1.5 rounded-lg hover:bg-zinc-50 disabled:opacity-50 transition-colors"
                >
                  {copied ? '✓ 복사됨' : '📋 복사'}
                </button>
              </div>
              <div className="flex items-center gap-2">
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
          </div>
        )}
      </div>
    </div>
  )
}
