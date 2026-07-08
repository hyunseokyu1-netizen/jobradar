'use client'

import { useState } from 'react'
import { initializePaddle } from '@paddle/paddle-js'
import { getBillingContext, createPortalSession } from '@/app/billing-actions'

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

  async function handleUpgrade() {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
    const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID
    if (!token || !priceId) {
      setError('결제 설정이 아직 준비되지 않았습니다.')
      return
    }

    const ctx = await getBillingContext()
    if (ctx.error || !ctx.email || !ctx.profileId) {
      setError(ctx.error ?? '오류가 발생했어요.')
      return
    }

    const paddle = await initializePaddle({
      token,
      environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
    })
    if (!paddle) {
      setError('결제 모듈을 불러오지 못했어요. 잠시 후 다시 시도해주세요.')
      return
    }

    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email: ctx.email },
      customData: { profile_id: ctx.profileId },
      settings: { successUrl: `${window.location.origin}/pricing?success=1` },
    })
  }

  async function handleClick() {
    setLoading(true)
    setError('')
    if (mode === 'upgrade') {
      await handleUpgrade()
      setLoading(false)
      return
    }
    const res = await createPortalSession()
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
