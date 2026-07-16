'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { matchSingleJob } from '@/app/actions'

/**
 * 워크스페이스 배너의 직무 매칭률 배지 — 클릭하면 현재 이력서로 AI 매칭을 다시 측정한다.
 * (이력서를 다듬은 뒤 점수가 어떻게 바뀌는지 바로 확인하는 용도)
 */
export default function RematchScoreBadge({
  jobId,
  matchRate,
}: {
  jobId: string
  /** null = 미채점·분석 실패 */
  matchRate: number | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState<number | null>(matchRate)
  const [error, setError] = useState('')

  async function rematch() {
    if (loading) return
    setLoading(true)
    setError('')
    const res = await matchSingleJob(jobId)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    // score === null: AI 분석 실패 — 0점(실제 판정)과 구분해 재시도를 유도
    if (res.score !== undefined) setScore(res.score)
    router.refresh()
  }

  return (
    <span className="flex items-center gap-2">
      {error && <span className="text-[11px] text-red-500">{error}</span>}
      <button
        type="button"
        onClick={rematch}
        disabled={loading}
        title="클릭하면 현재 이력서로 매칭률을 다시 측정합니다"
        className="group flex items-center gap-1.5 rounded-[7px] bg-[#046C4E] px-[11px] py-[3px] text-[14px] font-bold text-white transition hover:bg-[#035A40] disabled:opacity-70"
      >
        {loading ? '측정 중...' : score === null ? '미측정' : `${score}%`}
        {!loading && (
          <span aria-hidden className="text-[11px] font-normal opacity-70 transition group-hover:rotate-180">↻</span>
        )}
      </button>
    </span>
  )
}
