'use client'

import { useState } from 'react'
import { addJobByUrl } from '@/app/actions'

export default function AddJobForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [url, setUrl] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData()
    fd.append('url', url)
    const result = await addJobByUrl(fd)
    if (result.error) {
      setLoading(false)
      setError(result.error)
      return
    }

    // 저장 후 즉시 스크래핑 트리거
    if (result.jobId) {
      await fetch('/api/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: result.jobId }),
      })
    }

    setLoading(false)
    setUrl('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <input
        type="url"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="채용공고 URL 붙여넣기 (Seek, Indeed, LinkedIn...)"
        className="flex-1 text-sm border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-zinc-400 transition-colors"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !url}
        className="text-sm bg-zinc-900 text-white px-4 py-2.5 rounded-lg hover:bg-zinc-700 disabled:opacity-40 transition-colors whitespace-nowrap"
      >
        {loading ? '추가 중...' : '추가'}
      </button>
      {error && <p className="text-xs text-red-500 mt-1 absolute">{error}</p>}
    </form>
  )
}
