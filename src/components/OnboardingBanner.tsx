'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// 온보딩 미완료 유저에게 프로필 완성을 유도하는 배너.
// 온보딩 페이지 자체에서는 숨긴다.
export default function OnboardingBanner() {
  const pathname = usePathname()
  if (pathname?.startsWith('/onboarding')) return null

  return (
    <Link
      href="/onboarding"
      className="block bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
    >
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
        <span>
          ✨ 프로필을 완성하고 나에게 꼭 맞는 채용 매칭을 받아보세요.
        </span>
        <span className="font-medium whitespace-nowrap underline underline-offset-2">
          완성하기 →
        </span>
      </div>
    </Link>
  )
}
