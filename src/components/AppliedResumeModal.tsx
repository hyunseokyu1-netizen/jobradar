'use client'

import { useState, useRef } from 'react'
import { uploadAppliedResume } from '@/app/actions'

interface Props {
  jobId: string
  jobTitle: string
  company: string
  initialFilename?: string | null
  initialText?: string | null
  onClose: () => void
  onUploaded: (filename: string, text: string) => void
}

export default function AppliedResumeModal({
  jobId, jobTitle, company, initialFilename, initialText, onClose, onUploaded,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [filename, setFilename] = useState(initialFilename ?? '')
  const [text, setText] = useState(initialText ?? '')
  const [showText, setShowText] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('파일 크기는 5MB 이하여야 합니다.'); return }

    setUploading(true)
    setError('')
    const fd = new FormData()
    fd.append('resume', file)
    fd.append('jobId', jobId)
    const result = await uploadAppliedResume(fd)
    setUploading(false)

    if (result.error) {
      setError(result.error)
    } else {
      setFilename(file.name)
      setText(result.text ?? '')
      onUploaded(file.name, result.text ?? '')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between p-5 border-b border-[#F0F2F4]">
          <div>
            <h2 className="font-semibold text-[#101828]">제출 이력서</h2>
            <p className="text-xs text-[#98A2B3] mt-0.5">{jobTitle} · {company}</p>
          </div>
          <button onClick={onClose} className="text-[#98A2B3] hover:text-[#475467] transition-colors text-xl leading-none">✕</button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 업로드 영역 */}
          <div className="flex items-center gap-3">
            <label className={`cursor-pointer inline-flex items-center gap-2 text-sm border border-[#E2E6EA] rounded-lg px-4 py-2 hover:bg-[#F4F6F8] transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={handleFile}
                disabled={uploading}
              />
              {uploading ? '업로드 중...' : filename ? '파일 교체' : '파일 선택'}
            </label>
            {filename && !uploading && (
              <span className="text-sm text-[#667085] truncate max-w-[200px]">{filename}</span>
            )}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* 텍스트 뷰 토글 */}
          {text && (
            <div>
              <button
                onClick={() => setShowText(p => !p)}
                className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
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
            </div>
          )}

          {!text && !uploading && (
            <p className="text-sm text-[#98A2B3]">PDF 또는 DOCX 파일을 업로드하세요.</p>
          )}
        </div>
      </div>
    </div>
  )
}
