'use client'

import { useState } from 'react'
import { addJobByUrl, matchSingleJob } from '@/app/actions'

export default function AddJobForm() {
  const [status, setStatus] = useState<'idle' | 'saving' | 'scraping' | 'matching'>('idle')
  const [error, setError] = useState('')
  const [url, setUrl] = useState('')

  const loading = status !== 'idle'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    setStatus('saving')
    const fd = new FormData()
    fd.append('url', url)
    const result = await addJobByUrl(fd)
    if (result.error) { setStatus('idle'); setError(result.error); return }

    if (result.jobId) {
      setStatus('scraping')
      await fetch('/api/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: result.jobId }),
      })

      setStatus('matching')
      await matchSingleJob(result.jobId)
    }

    setStatus('idle')
    setUrl('')
  }

  const label = status === 'scraping' ? 'JD 분석 중...' : status === 'matching' ? 'AI 매칭 중...' : status === 'saving' ? '저장 중...' : '추가'

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6 relative">
      <input
        type="url"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="채용공고 URL 붙여넣기 (Seek, Indeed, LinkedIn, Glassdoor...)"
        className="flex-1 text-sm border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-zinc-400 transition-colors"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !url}
        className="text-sm bg-zinc-900 text-white px-4 py-2.5 rounded-lg hover:bg-zinc-700 disabled:opacity-40 transition-colors whitespace-nowrap min-w-28 text-center"
      >
        {label}
      </button>
      {error && <p className="text-xs text-red-500 absolute -bottom-5 left-0">{error}</p>}
    </form>
  )
}
