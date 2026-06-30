'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateWorkspaceOptimization } from '@/app/actions'
import { Sparkle } from '../ui/icons'

/**
 * 워크스페이스 영어 이력서를 타깃 공고에 맞춰 AI 분석(하이라이트·최적화 노트 생성).
 * 결과는 캐싱되어 재방문 시 즉시 표시된다.
 */
export default function GenerateOptimizationButton({
  jobId,
  label,
  loadingLabel,
}: {
  jobId: string
  label: string
  loadingLabel: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setLoading(true)
    setError('')
    const res = await generateWorkspaceOptimization(jobId)
    if (res.error) {
      setError(res.error)
      setLoading(false)
      return
    }
    router.refresh()
    // refresh 후 서버가 최적화 노트를 렌더 → 버튼이 사라지므로 loading 유지
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-[6px] rounded-[9px] border border-[#CEEBDC] bg-[#ECFDF3] px-3 py-[7px] text-[13px] font-semibold text-[#046C4E] hover:bg-[#DCF5E8] disabled:opacity-60"
      >
        <Sparkle size={14} strokeWidth={1.8} />
        {loading ? loadingLabel : label}
      </button>
      {error && <span className="max-w-[280px] text-right text-[11px] text-red-500">{error}</span>}
    </div>
  )
}
