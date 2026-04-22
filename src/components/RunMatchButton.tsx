'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { triggerMatching } from '@/app/actions'

export default function RunMatchButton({ unmatchedCount }: { unmatchedCount: number }) {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const router = useRouter()

  async function handleClick() {
    setRunning(true)
    setResult(null)
    const res = await triggerMatching()
    if (res.error) {
      setResult(`오류: ${res.error}`)
    } else {
      setResult(`${res.matched}개 매칭 완료`)
      router.refresh()
    }
    setRunning(false)
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className={`text-sm ${result.startsWith('오류') ? 'text-red-500' : 'text-green-600'}`}>
          {result}
        </span>
      )}
      <button
        onClick={handleClick}
        disabled={running || unmatchedCount === 0}
        className="text-sm bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 disabled:opacity-40 transition-colors"
      >
        {running ? '매칭 중...' : `AI 매칭 실행${unmatchedCount > 0 ? ` (${unmatchedCount})` : ''}`}
      </button>
    </div>
  )
}
