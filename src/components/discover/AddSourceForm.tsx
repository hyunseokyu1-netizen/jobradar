'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addJobSource } from '@/app/discover/actions'

export default function AddSourceForm() {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const fd = new FormData()
    fd.append('name', name)
    fd.append('url', url)
    const result = await addJobSource(fd)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setName('')
    setUrl('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="회사 이름 (예: Spotify, 비워두면 자동)"
          className="sm:w-56 text-sm border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-zinc-400 transition-colors"
          disabled={loading}
        />
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="채용 페이지 URL (예: https://jobs.lever.co/spotify)"
          className="flex-1 text-sm border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-zinc-400 transition-colors"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !url}
          className="text-sm bg-zinc-900 text-white px-4 py-2.5 rounded-lg hover:bg-zinc-700 disabled:opacity-40 transition-colors whitespace-nowrap"
        >
          {loading ? '등록 중...' : '페이지 등록'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <p className="text-xs text-zinc-400 mt-1.5">
        Greenhouse · Lever · Ashby · SmartRecruiters는 자동 인식됩니다. 그 외 페이지는 AI가 공고 목록을 추출합니다.
      </p>
    </form>
  )
}
