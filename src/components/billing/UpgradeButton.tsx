'use client'

import { useState } from 'react'
import { createCheckoutSession, createPortalSession } from '@/app/billing-actions'

export default function UpgradeButton({
  mode = 'upgrade',
  label,
  className,
}: {
  mode?: 'upgrade' | 'manage'
  label?: string
  className?: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setLoading(true)
    setError('')
    const res = mode === 'manage' ? await createPortalSession() : await createCheckoutSession()
    if (res.error || !res.url) {
      setLoading(false)
      setError(res.error ?? '오류가 발생했어요.')
      return
    }
    window.location.href = res.url
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={className ?? 'w-full rounded-lg bg-[#046C4E] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#035A40] disabled:opacity-50'}
      >
        {loading ? '이동 중…' : label ?? (mode === 'manage' ? '구독 관리' : '프리미엄 시작하기')}
      </button>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  )
}
