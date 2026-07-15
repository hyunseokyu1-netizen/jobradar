'use client'

import { useState, useRef } from 'react'
import {
  uploadApplicationDocument, deleteApplicationDocument, getApplicationDocumentUrl,
} from '@/app/actions'
import { MAX_APPLIED_DOCUMENTS, type AppliedDocument } from '@/lib/applied-documents'

interface Props {
  jobId: string
  jobTitle: string
  company: string
  initialFilename?: string | null
  initialText?: string | null
  initialDocuments?: AppliedDocument[]
  onClose: () => void
  onUploaded: () => void
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  return `${Math.max(1, Math.round(bytes / 1024))}KB`
}

/**
 * 제출 서류 모달 — 공고별 파일 최대 5개 (이력서·포트폴리오·경력기술서 등).
 * PDF/DOCX 업로드 시 지원 이력서 텍스트가 비어있으면 자동 추출해 채운다.
 */
export default function AppliedResumeModal({
  jobId, jobTitle, company, initialFilename, initialText, initialDocuments, onClose, onUploaded,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [busyPath, setBusyPath] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [documents, setDocuments] = useState<AppliedDocument[]>(initialDocuments ?? [])
  const [text, setText] = useState(initialText ?? '')
  const [showText, setShowText] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const full = documents.length >= MAX_APPLIED_DOCUMENTS

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('파일 크기는 10MB 이하여야 합니다.'); return }

    setUploading(true)
    setError('')
    const fd = new FormData()
    fd.append('document', file)
    fd.append('jobId', jobId)
    const result = await uploadApplicationDocument(fd)
    setUploading(false)

    if (result.error) {
      setError(result.error)
    } else {
      if (result.documents) setDocuments(result.documents)
      if (result.resumeText) setText(result.resumeText)
      onUploaded()
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDownload(doc: AppliedDocument) {
    setBusyPath(doc.path)
    setError('')
    const res = await getApplicationDocumentUrl(jobId, doc.path)
    setBusyPath(null)
    if (res.error || !res.url) { setError(res.error ?? 'URL 생성 실패'); return }
    const a = document.createElement('a')
    a.href = res.url
    a.download = doc.name
    a.click()
  }

  async function handleDelete(doc: AppliedDocument) {
    if (!confirm(`"${doc.name}" 파일을 삭제할까요?`)) return
    setBusyPath(doc.path)
    setError('')
    const res = await deleteApplicationDocument(jobId, doc.path)
    setBusyPath(null)
    if (res.error) { setError(res.error); return }
    if (res.documents) setDocuments(res.documents)
    onUploaded()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80dvh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between p-5 border-b border-[#F0F2F4]">
          <div>
            <h2 className="font-semibold text-[#101828]">제출 서류</h2>
            <p className="text-xs text-[#98A2B3] mt-0.5">{jobTitle} · {company}</p>
          </div>
          <button onClick={onClose} className="text-[#98A2B3] hover:text-[#475467] transition-colors text-xl leading-none">✕</button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 파일 목록 */}
          {documents.length > 0 && (
            <ul className="space-y-2">
              {documents.map(doc => (
                <li
                  key={doc.path}
                  className="flex items-center gap-3 rounded-lg border border-[#ECEEF0] px-3.5 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#344054]">{doc.name}</p>
                    <p className="text-[11px] text-[#98A2B3]">
                      {formatSize(doc.size)} · {new Date(doc.uploadedAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    disabled={busyPath !== null}
                    className="shrink-0 text-xs font-medium text-[#046C4E] hover:underline disabled:opacity-40"
                  >
                    {busyPath === doc.path ? '…' : '다운로드'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc)}
                    disabled={busyPath !== null}
                    className="shrink-0 text-xs text-[#B0B7C0] hover:text-red-500 transition-colors disabled:opacity-40"
                    title="삭제"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* 업로드 */}
          <div className="flex items-center gap-3">
            <label className={`cursor-pointer inline-flex items-center gap-2 text-sm border border-[#E2E6EA] rounded-lg px-4 py-2 hover:bg-[#F4F6F8] transition-colors ${uploading || full ? 'opacity-50 pointer-events-none' : ''}`}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.zip"
                className="hidden"
                onChange={handleFile}
                disabled={uploading || full}
              />
              {uploading ? '업로드 중...' : '+ 파일 추가'}
            </label>
            <span className="text-xs text-[#98A2B3]">
              {documents.length} / {MAX_APPLIED_DOCUMENTS}
              {full && ' · 최대 개수에 도달했어요'}
            </span>
          </div>
          <p className="text-xs text-[#98A2B3]">
            이력서·포트폴리오·경력기술서 등을 공고별로 보관하세요. PDF·DOCX·이미지·ZIP, 파일당 10MB.
          </p>
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* 이력서 텍스트 추출본 (PDF/DOCX 업로드 시 자동 추출 — AI 분석에 활용) */}
          {(text || initialFilename) && (
            <div className="border-t border-[#F0F2F4] pt-3">
              <p className="text-xs text-[#667085]">
                지원 이력서 텍스트{initialFilename ? ` · ${initialFilename}` : ''}
              </p>
              {text && (
                <>
                  <button
                    onClick={() => setShowText(p => !p)}
                    className="mt-1 text-xs text-blue-500 hover:text-blue-700 transition-colors"
                  >
                    {showText ? '▲ 텍스트 접기' : '▼ 텍스트 보기'}
                  </button>
                  {showText && (
                    <textarea
                      readOnly
                      value={text}
                      className="mt-2 w-full text-xs text-[#667085] bg-[#F7F8FA] border border-[#ECEEF0] rounded-lg p-3 resize-y min-h-48"
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
