'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addJobByUrl, matchSingleJob } from '@/app/actions'
import AddJobManualModal from './AddJobManualModal'

export default function AddJobForm() {
  const [status, setStatus] = useState<'idle' | 'saving' | 'scraping' | 'matching' | 'done'>('idle')
  const [error, setError] = useState('')
  const [url, setUrl] = useState('')
  const [manualOpen, setManualOpen] = useState(false)

  const router = useRouter()
  const loading = status !== 'idle' && status !== 'done'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    setStatus('saving')
    const fd = new FormData()
    fd.append('url', url)
    const result = await addJobByUrl(fd)
    if (result.error) { setStatus('idle'); setError(result.error); return }

    if (result.duplicate) {
      setStatus('idle')
      alert('이미 등록된 공고입니다.')
      return
    }

    if (result.jobId) {
      if (!result.alreadyScraped) {
        setStatus('scraping')
        await fetch('/api/scrape-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: result.jobId }),
        })
      }

      setStatus('matching')
      await matchSingleJob(result.jobId)
    }

    setUrl('')
    router.refresh()
    setStatus('done')
    setTimeout(() => setStatus('idle'), 3000)
  }

  const label = status === 'scraping' ? 'JD 분석 중...' : status === 'matching' ? 'AI 매칭 중...' : status === 'saving' ? '저장 중...' : '추가'

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="채용공고 URL 붙여넣기 (Seek, Indeed, LinkedIn, Glassdoor...)"
          className="flex-1 text-sm border border-[#ECEEF0] rounded-lg px-4 py-2.5 outline-none focus:border-[#046C4E] transition-colors"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !url}
          className="text-sm bg-[#046C4E] text-white px-4 py-2.5 rounded-lg hover:bg-[#035A40] disabled:opacity-40 transition-colors whitespace-nowrap sm:min-w-28 text-center"
        >
          {label}
        </button>
        <button
          type="button"
          onClick={() => setManualOpen(true)}
          disabled={loading}
          className="text-sm border border-[#ECEEF0] text-[#475467] px-4 py-2.5 rounded-lg hover:bg-[#F4F6F8] disabled:opacity-40 transition-colors whitespace-nowrap text-center"
        >
          직접 추가
        </button>
      </form>
      <p className="text-xs text-[#98A2B3] mt-1.5">
        링크 복사가 안 되는 사이트는 <button type="button" onClick={() => setManualOpen(true)} className="underline hover:text-[#475467]">직접 추가</button>로 카드를 만드세요.
      </p>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {status === 'done' && (
        <p className="text-xs text-green-600 mt-1">✓ 등록되었습니다.</p>
      )}

      {manualOpen && <AddJobManualModal onClose={() => setManualOpen(false)} />}
    </div>
  )
}
