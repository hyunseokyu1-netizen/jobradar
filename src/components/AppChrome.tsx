'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import OnboardingBanner from '@/components/OnboardingBanner'

/**
 * 전역 크롬(헤더 + 온보딩 배너 + 메인 래퍼)을 담당.
 * MatchDa 화면(/matchda/*)은 자체 헤더/사이드바를 가지므로 전역 크롬을 숨기고
 * 풀블리드로 렌더한다.
 */
export default function AppChrome({
  userEmail,
  showOnboardingBanner,
  signOutAction,
  children,
}: {
  userEmail: string | null
  showOnboardingBanner: boolean
  signOutAction: () => void
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isMatchda = pathname?.startsWith('/matchda')
  // 루트(/)는 자체 크롬을 가진 MatchDa 화면(비로그인=랜딩, 로그인=대시보드) → 전역 크롬 숨김
  const isHome = pathname === '/'

  if (isMatchda || isHome) {
    return <>{children}</>
  }

  return (
    <>
      <header className="border-b border-zinc-200 bg-white">
        <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight">
            🎯 MatchDa
          </Link>
          {userEmail ? (
            <div className="flex items-center gap-4 text-sm font-medium text-zinc-600">
              <Link href="/" className="hover:text-zinc-900">지원 관리</Link>
              <Link href="/discover" className="hover:text-zinc-900">잡 탐색</Link>
              <Link href="/profile" className="hover:text-zinc-900">프로필</Link>
              <span className="text-zinc-300 hidden sm:block">|</span>
              <span className="text-zinc-400 text-xs hidden sm:block truncate max-w-40">{userEmail}</span>
              <form action={signOutAction}>
                <button type="submit" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors whitespace-nowrap">
                  로그아웃
                </button>
              </form>
            </div>
          ) : (
            <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              로그인
            </Link>
          )}
        </nav>
      </header>
      {showOnboardingBanner && <OnboardingBanner />}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </>
  )
}
