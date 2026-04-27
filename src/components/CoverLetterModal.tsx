'use client'

import { useState } from 'react'
import { generateCoverLetter } from '@/app/actions'

interface Props {
  jobId: string
  jobTitle: string
  company: string
  onClose: () => void
}

async function downloadTxt(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

async function downloadDocx(content: string, filename: string) {
  const { Document, Packer, Paragraph, TextRun } = await import('docx')
  const paragraphs = content.split('\n').map(line =>
    new Paragraph({ children: [new TextRun(line)] })
  )
  const doc = new Document({ sections: [{ children: paragraphs }] })
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.docx`
  a.click()
  URL.revokeObjectURL(url)
}

async function downloadPdf(content: string, filename: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const lines = doc.splitTextToSize(content, 180)
  doc.setFontSize(11)
  doc.text(lines, 15, 20)
  doc.save(`${filename}.pdf`)
}

export default function CoverLetterModal({ jobId, jobTitle, company, onClose }: Props) {
  const [content, setContent] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState<'txt' | 'docx' | 'pdf' | null>(null)

  const filename = `cover_letter_${company.replace(/\s+/g, '_')}_${jobTitle.replace(/\s+/g, '_')}`.slice(0, 60)

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
                className="text-sm border border-zinc-200 px-3 py-2 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                {copied ? '✓ 복사됨' : '복사'}
              </button>
              <button
                onClick={() => handleDownload('txt')}
                disabled={!!downloading}
                className="text-sm border border-zinc-200 px-3 py-2 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                {downloading === 'txt' ? '...' : 'TXT'}
              </button>
              <button
                onClick={() => handleDownload('docx')}
                disabled={!!downloading}
                className="text-sm border border-zinc-200 px-3 py-2 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                {downloading === 'docx' ? '...' : 'DOCX'}
              </button>
              <button
                onClick={() => handleDownload('pdf')}
                disabled={!!downloading}
                className="text-sm border border-zinc-200 px-3 py-2 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                {downloading === 'pdf' ? '...' : 'PDF'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
